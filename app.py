from flask import (Flask, render_template, request, redirect,
                url_for, session, flash, jsonify, send_file)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps # For decorators
import os, datetime, csv, io, json # Standard library imports
from sqlalchemy import desc

app = Flask(__name__)
app.config['SECRET_KEY']                     = os.environ.get('SECRET_KEY', 'hm-dev-secret-2024')
app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///healthmate.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ══════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    firebase_uid  = db.Column(db.String(128), unique=True, nullable=True)
    role          = db.Column(db.String(20),  default='user') # user, coach
    is_active     = db.Column(db.Boolean,     default=True)
    created_at    = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    coach_id      = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    profile      = db.relationship('Profile',     backref='user', uselist=False, cascade='all, delete-orphan')
    meals        = db.relationship('Meal',        backref='user', lazy=True,     cascade='all, delete-orphan')
    food_history = db.relationship('FoodHistory', backref='user', lazy=True,     cascade='all, delete-orphan')
    reminders    = db.relationship('Reminder',    backref='user', lazy=True,     cascade='all, delete-orphan')

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)
    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    @property
    def display_name(self):
        return (self.profile.full_name if self.profile and self.profile.full_name
                else self.username)
    @property
    def initials(self):
        parts = self.display_name.split()
        return ''.join(p[0].upper() for p in parts[:2])

class Admin(db.Model):
    __tablename__ = 'admins'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(20), default='superadmin')
    last_login    = db.Column(db.DateTime)

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)
    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

class Profile(db.Model):
    __tablename__ = 'profiles'
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    full_name      = db.Column(db.String(120), default='')
    age            = db.Column(db.Integer,     default=0)
    gender         = db.Column(db.String(10),  default='')
    height         = db.Column(db.Float,       default=0.0)
    weight         = db.Column(db.Float,       default=0.0)
    activity_level = db.Column(db.String(30),  default='moderate')
    goal           = db.Column(db.String(30),  default='maintain')
    bmi            = db.Column(db.Float,       default=0.0)
    bmr            = db.Column(db.Float,       default=0.0)
    tdee           = db.Column(db.Float,       default=0.0)
    calorie_target = db.Column(db.Integer,     default=2000)
    updated_at     = db.Column(db.DateTime,    default=datetime.datetime.utcnow,
                            onupdate=datetime.datetime.utcnow)

class Meal(db.Model):
    __tablename__ = 'meals'
    id        = db.Column(db.Integer,     primary_key=True)
    user_id   = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=False)
    food_name = db.Column(db.String(120), nullable=False)
    calories  = db.Column(db.Float,       nullable=False)
    weight_grams = db.Column(db.Float,     default=100.0)
    meal_type = db.Column(db.String(20),  default='other')
    meal_date = db.Column(db.Date,        default=datetime.date.today, index=True) # Added index for efficient date-based queries
    logged_at = db.Column(db.DateTime,    default=datetime.datetime.utcnow)
    global_food_id = db.Column(db.Integer, db.ForeignKey('global_foods.id'), nullable=True)
    global_food = db.relationship('GlobalFood', backref=db.backref('meals_logged', lazy=True))

class GlobalFood(db.Model):
    __tablename__ = 'global_foods'
    id        = db.Column(db.Integer, primary_key=True)
    name      = db.Column(db.String(120), unique=True, nullable=False)
    calories_per_100g = db.Column(db.Float, nullable=False)
    serving_size      = db.Column(db.String(50), default='100g')
    category  = db.Column(db.String(50), default='General')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, 
                        onupdate=datetime.datetime.utcnow)

    @property
    def calories(self): # Compatibility with older code
        return self.calories_per_100g

class FoodHistory(db.Model):
    __tablename__ = 'food_history'
    id         = db.Column(db.Integer,     primary_key=True)
    user_id    = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=False)
    food_name  = db.Column(db.String(120), nullable=False)
    calories   = db.Column(db.Float,       nullable=False)
    frequency  = db.Column(db.Integer,     default=1)
    last_eaten = db.Column(db.DateTime,    default=datetime.datetime.utcnow, index=True) # Added index for recency
    __table_args__ = (db.UniqueConstraint('user_id', 'food_name', name='uq_user_food_history'),) # Renamed for clarity

class Reminder(db.Model):
    __tablename__ = 'reminders'
    id            = db.Column(db.Integer,     primary_key=True)
    user_id       = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=False, index=True) # Added index for user-specific reminders
    reminder_type = db.Column(db.String(20),  nullable=False)
    label         = db.Column(db.String(120), nullable=False)
    hour          = db.Column(db.Integer,     nullable=False)
    minute        = db.Column(db.Integer,     nullable=False)
    ampm          = db.Column(db.String(2),   nullable=False)
    repeat_times  = db.Column(db.Integer,     default=1)
    interval      = db.Column(db.Integer,     default=0)
    medicine_name = db.Column(db.String(120), default='')
    dosage        = db.Column(db.String(80),  default='')
    is_active     = db.Column(db.Boolean,     default=True)
    created_at    = db.Column(db.DateTime,    default=datetime.datetime.utcnow)

    @property
    def time_display(self):
        return f"{self.hour}:{self.minute:02d} {self.ampm}"

    @property
    def hour_24(self):
        h = self.hour
        if self.ampm == 'PM' and h != 12: h += 12
        elif self.ampm == 'AM' and h == 12: h = 0
        return h

    @property
    def sort_key(self):
        return self.hour_24 * 60 + self.minute

    @property
    def is_upcoming(self):
        now = datetime.datetime.now()
        return (self.hour_24 * 60 + self.minute) > (now.hour * 60 + now.minute)

    @property
    def type_icon(self):
        return {'meal':'🍽','water':'💧','activity':'🏃','medicine':'💊'}.get(
            self.reminder_type, '🔔')

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, nullable=True) # ID of user or admin
    actor_name = db.Column(db.String(100))
    role       = db.Column(db.String(20)) # user, coach, admin, superadmin
    action     = db.Column(db.String(255), nullable=False)
    ip_address = db.Column(db.String(45), index=True) # Added index for filtering/analysis
    timestamp  = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class ReminderLog(db.Model):
    __tablename__ = 'reminder_logs'
    id          = db.Column(db.Integer, primary_key=True)
    reminder_id = db.Column(db.Integer, db.ForeignKey('reminders.id'), nullable=False)
    status      = db.Column(db.String(20)) # completed, missed
    timestamp   = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class BackupLog(db.Model):
    __tablename__ = 'backup_logs'
    id         = db.Column(db.Integer, primary_key=True)
    filename   = db.Column(db.String(255), nullable=False)
    status     = db.Column(db.String(20), default='Success')
    details    = db.Column(db.Text, nullable=True)
    timestamp  = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    admin_id   = db.Column(db.Integer, db.ForeignKey('admins.id'))

class CoachNote(db.Model):
    __tablename__ = 'coach_notes'
    id         = db.Column(db.Integer, primary_key=True)
    coach_id   = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    coach      = db.relationship('Admin', backref=db.backref('notes_written', lazy=True))

# ══════════════════════════════════════════════════════
# SERVICE LAYER
# ══════════════════════════════════════════════════════

class AnalyticsService:
    @staticmethod
    def get_dashboard_data(user_id):
        user = db.session.get(User, user_id)
        prof = user.profile
        today = datetime.date.today()
        
        meals = Meal.query.filter_by(user_id=user_id, meal_date=today).all()
        consumed = sum(m.calories for m in meals)
        target = prof.calorie_target if prof else 2000
        
        tdee = prof.tdee if prof else 2000
        net_balance = consumed - tdee
        forecast = get_weight_forecast(prof, prof.weight if prof else 0.0)
        
        return {
            'consumed': consumed,
            'target': target,
            'net_balance': net_balance,
            'forecast': forecast
        }

class FoodService:
    @staticmethod
    def export_csv():
        foods = GlobalFood.query.all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['name', 'calories_per_100g', 'category'])
        for f in foods:
            writer.writerow([f.name, f.calories_per_100g, f.category])
        return output.getvalue()

    @staticmethod
    def import_csv(file):
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        reader = csv.DictReader(stream)
        added = 0
        for row in reader:
            if not GlobalFood.query.filter_by(name=row['name']).first():
                food = GlobalFood(
                    name=row['name'],
                    calories_per_100g=float(row['calories_per_100g']),
                    category=row.get('category', 'General')
                )
                db.session.add(food)
                added += 1
        db.session.commit()
        return added

class BackupService:
    @staticmethod
    def perform_backup(admin_id):
        """Generates a JSON dump of the entire system state."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        backup_dir = os.path.join(base_dir, 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        data = {
            'users': [dict(id=u.id, username=u.username, email=u.email, role=u.role) for u in User.query.all()],
            'global_foods': [dict(name=f.name, cals=f.calories_per_100g, cat=f.category) for f in GlobalFood.query.all()],
            'audit_logs': [dict(actor=l.actor_name, action=l.action, ts=l.timestamp.isoformat()) for l in AuditLog.query.all()]
        }
        
        filename = "backup.json"
        dest_path = os.path.join(backup_dir, filename)
        
        with open(dest_path, 'w') as f:
            json.dump(data, f)

        log = BackupLog(filename=filename, admin_id=admin_id, details=f"Manual export: {len(data['users'])} users")
        db.session.add(log)
        db.session.commit()
        return filename

    @staticmethod
    def restore_from_json(file_stream, admin_id):
        data = json.load(file_stream)
        summary = f"Imported {len(data.get('global_foods', []))} global foods."
        for f_data in data.get('global_foods', []):
            if not GlobalFood.query.filter_by(name=f_data['name']).first():
                food = GlobalFood(name=f_data['name'], calories_per_100g=f_data['cals'], category=f_data['cat'])
                db.session.add(food)
        db.session.commit()
        log_activity(f"System Restore: {summary}", admin_id, "Admin")
        return summary

def get_greeting():
    h = datetime.datetime.now().hour
    if  5 <= h < 12: return 'Good morning'
    if 12 <= h < 17: return 'Good afternoon'
    return 'Good evening'

ACTIVITY_FACTORS = {
    'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55,
    'active': 1.725, 'athlete': 1.9,
}
GOAL_ADJUSTMENTS = {'lose': -0.20, 'maintain': 0.0, 'gain': 0.15}

def get_meal_type_now():
    h = datetime.datetime.now().hour
    if  5 <= h < 11: return 'breakfast'
    if 11 <= h < 15: return 'lunch'
    if 15 <= h < 18: return 'snack'
    if 18 <= h < 22: return 'dinner'
    return 'other'

def calc_metrics(weight, height_cm, age, gender, activity, goal):
    h_m = height_cm / 100.0
    bmi = int(round(weight / (h_m ** 2)))
    if gender.lower() == 'male':
        bmr = 10 * weight + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height_cm - 5 * age - 161
    bmr  = int(round(bmr))
    tdee = int(round(bmr * ACTIVITY_FACTORS.get(activity, 1.375)))
    cal  = int(tdee * (1 + GOAL_ADJUSTMENTS.get(goal, 0.0)))
    if   bmi < 18.5: cat, col, bg = 'Underweight', '#3B82F6', '#EFF6FF'
    elif bmi < 25:   cat, col, bg = 'Normal',      '#22C55E', '#F0FDF4'
    elif bmi < 30:   cat, col, bg = 'Overweight',  '#F59E0B', '#FFFBEB'
    else:            cat, col, bg = 'Obese',       '#EF4444', '#FEF2F2'
    return {'bmi': bmi, 'bmi_category': cat, 'bmi_color': col, 'bmi_bg': bg,
            'bmr': bmr, 'tdee': tdee, 'calorie_target': cal}

def bmi_pct(bmi):
    return min(100, round(bmi / 40 * 100))

def get_weight_forecast(profile, current_weight):
    """Predicts weight change over 7 and 30 days based on calorie deficit/surplus."""
    if not profile or current_weight <= 0:
        return {'weekly_diff': 0, 'forecast_7d': 0, 'forecast_30d': 0}
    
    # Approx 7700 calories per 1kg of weight change
    deficit = profile.calorie_target - profile.tdee
    weekly_change = (deficit * 7) / 7700

    return {
        'weekly_diff': int(round(weekly_change)),
        'forecast_7d':  int(round(float(current_weight) + weekly_change)),
        'forecast_4w':  int(round(float(current_weight) + (weekly_change * 4))),
        'forecast_30d': int(round(float(current_weight) + (weekly_change * (30/7))))
    }

def get_suggestions(user_id, top_n=6):
    user = db.session.get(User, user_id)
    prof = user.profile
    if not prof: return []
    mt = get_meal_type_now()
    # Calculate remaining budget for smart filtering
    today = datetime.date.today()
    consumed = sum(m.calories for m in Meal.query.filter_by(user_id=user_id, meal_date=today).all())
    budget = max(0, prof.calorie_target - consumed)

    # AI Database: Smart defaults with calorie metadata
    SMART_DB = {
        'breakfast': [('Greek Yogurt w/ Berries', 250), ('Oatmeal w/ Honey', 300), ('Avocado Toast', 350), ('Scrambled Eggs', 280), ('Fruit Smoothie', 220)],
        'lunch':     [('Grilled Chicken Salad', 350), ('Quinoa Bowl', 450), ('Turkey Sandwich', 400), ('Lentil Soup', 300), ('Beef Stir-fry', 550)],
        'snack':     [('Apple slices', 95), ('Almonds (1oz)', 160), ('Cottage Cheese', 120), ('Protein Bar', 200)],
        'dinner':    [('Baked Salmon', 450), ('Grilled Steak & Veggies', 600), ('Chicken Pasta', 500), ('Tofu Stir-fry', 400)],
        'other':     [('Green Tea', 0), ('Mixed Nuts', 170), ('Protein Shake', 180)]
    }
    history = FoodHistory.query.filter_by(user_id=user_id).all()
    scored = []
    # Score History Items
    for fh in history:
        days = (datetime.datetime.utcnow() - fh.last_eaten).days
        # Base score from frequency/recency
        score = fh.frequency * 5 + max(0, 15 - days)
        
        # Goal Alignment Score
        if prof.goal == 'lose' and fh.calories < 400: score += 15
        if prof.goal == 'gain' and fh.calories > 500: score += 15
        
        # Budget Check: Penalize if it heavily exceeds daily remaining kcal
        if fh.calories > (budget + 100): score -= 25
        scored.append((fh.food_name, fh.calories, score))
    # Mix in new "Discovery" items from SMART_DB
    existing_names = {s[0] for s in scored}
    for name, cal in SMART_DB.get(mt, SMART_DB['other']):
        if name not in existing_names:
            score = 10 # Discovery base
            if prof.goal == 'lose' and cal < 400: score += 15
            if prof.goal == 'gain' and cal > 500: score += 15
            if cal <= budget: score += 10
            scored.append((name, cal, score))
    scored.sort(key=lambda x: x[2], reverse=True)
    return [(n, c) for n, c, _ in scored[:top_n]]

def upsert_history(user_id, food_name, calories):
    fh = FoodHistory.query.filter_by(user_id=user_id, food_name=food_name).first()
    if fh:
        fh.frequency += 1
        fh.calories   = calories
        fh.last_eaten = datetime.datetime.utcnow()
    else:
        db.session.add(FoodHistory(user_id=user_id, food_name=food_name, calories=calories))

def log_activity(action, user_id=None, actor_name='System'):
    role = 'System'
    if 'admin_id' in session:
        admin = db.session.get(Admin, session['admin_id'])
        role = admin.role if admin else 'admin'
    elif 'user_id' in session:
        u = db.session.get(User, session['user_id'])
        role = u.role if u else 'user'
    log = AuditLog(
        user_id=user_id,
        actor_name=actor_name,
        action=action,
        role=role,
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

# ══════════════════════════════════════════════════════
# TEMPLATE HELPERS + AUTH GUARD
# ══════════════════════════════════════════════════════

@app.context_processor
def inject_globals():
    return {
        'now':      datetime.datetime.now(),
        'greeting': get_greeting(),
    }

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def role_required(roles):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            admin_id = session.get('admin_id')
            if admin_id:
                admin = db.session.get(Admin, admin_id)
                if admin and admin.role in roles:
                    return f(*args, **kwargs)
            
            # Check Coach/User role via standard user session
            u = current_user()
            if u and u.role in roles:
                return f(*args, **kwargs)
                
            flash('Unauthorized access.', 'danger')
            return redirect(url_for('login'))
        return decorated
    return wrapper

def admin_required(f):
    return role_required(['superadmin', 'admin'])(f)

def coach_required(f):
    return role_required(['superadmin', 'admin', 'coach'])(f)

def current_user():
    if 'user_id' in session:
        u = db.session.get(User, session['user_id'])
        if u and not u.is_active:
            session.clear()
            return None
        return u
    return None

# ══════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════
@app.route('/')
def index():
    return redirect(url_for('dashboard') if 'user_id' in session else url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # If JS fails to intercept, we prevent the old-style login
        flash('Login requires a secure session. Please ensure JavaScript is enabled.', 'warning')
        return redirect(url_for('login'))
    return render_template('auth.html', mode='login')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Prevent direct registration without Firebase
        flash('Registration requires a secure session. Please ensure JavaScript is enabled.', 'warning')
        return redirect(url_for('register'))
    return render_template('auth.html', mode='register')

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        # For a production system, a secure password reset involves:
        # 1. User requests reset by providing email/username.
        # 2. A unique, time-limited token is generated and emailed to the user.
        # 3. User clicks the link with the token, which verifies their identity.
        # 4. Only then are they allowed to set a new password.
        # This current implementation is a placeholder to prevent insecure direct password changes.
        flash('If an account with that email exists, a password reset link has been sent (this is a placeholder for a real email system).', 'info')
        return redirect(url_for('login'))
    return render_template('auth.html', mode='reset') # The form should only ask for email/username to initiate the reset

@app.route('/logout')
def logout():
    session.clear()
    flash('Signed out successfully.', 'info')
    return redirect(url_for('login'))

@app.route('/api/auth/firebase-sync', methods=['POST'])
def firebase_sync():
    """Syncs Firebase user with local database and sets session."""
    data = request.get_json()
    uid = data.get('uid')
    email = data.get('email')
    username = data.get('username') or email.split('@')[0]
    mode = data.get('mode') # 'login' or 'register'

    if not uid or not email:
        return jsonify({'success': False, 'error': 'Missing user data (UID or email)'}), 400

    # Try to find user by firebase_uid or email
    user = User.query.filter(
        (User.firebase_uid == uid) | (User.email == email)
    ).first()

    if not user:
        # User does not exist in local DB, create a new one
        # Ensure username is unique, append a number if necessary
        final_username = username
        counter = 1
        while User.query.filter_by(username=final_username).first():
            final_username = f"{username}{counter}"
            counter += 1

        user = User(username=final_username, email=email, firebase_uid=uid)
        user.set_password(os.urandom(24).hex()) # Dummy password, Firebase handles real auth
        db.session.add(user)
        db.session.commit()
        log_activity(f"New Firebase user registered: {email} (UID: {uid})", user.id, user.username)
        flash(f"Welcome, {user.display_name}! Your account has been created.", 'success')
    else:
        # User found in local DB
        if not user.firebase_uid:
            # Existing local user, now linked to Firebase
            user.firebase_uid = uid
            db.session.commit()
            log_activity(f"Existing user {user.email} linked to Firebase (UID: {uid})", user.id, user.username)
            flash(f"Welcome back, {user.display_name}! Your account is now linked to Firebase.", 'success')
        else:
            # User already exists and is linked
            log_activity(f"Firebase user {user.email} logged in (UID: {uid})", user.id, user.username)
            flash(f"Welcome back, {user.display_name}!", 'success')

    session['user_id'] = user.id
    # Redirect to profile if it's a new user or profile is incomplete
    redirect_url = url_for('dashboard')
    if not user.profile or not user.profile.full_name: # Check if profile exists and has a name
        redirect_url = url_for('profile')
        flash("Please complete your profile to get started! 🎉", 'info')

    return jsonify({'success': True, 'redirect': redirect_url})

# ══════════════════════════════════════════════════════
# PROFILE
# ══════════════════════════════════════════════════════

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user = current_user()
    prof = user.profile
    if request.method == 'POST':
        try:
            full_name = request.form.get('full_name', '').strip()
            age       = int(request.form['age'])
            gender    = request.form['gender']
            height    = float(request.form['height'])
            weight    = float(request.form['weight'])
            activity  = request.form['activity_level']
            goal      = request.form['goal']
            if not (10 <= age <= 120):    raise ValueError('Age must be 10–120.')
            if not (50 <= height <= 280): raise ValueError('Height must be 50–280 cm.')
            if not (20 <= weight <= 500): raise ValueError('Weight must be 20–500 kg.')
            m = calc_metrics(weight, height, age, gender, activity, goal)
            if prof is None:
                prof = Profile(user_id=user.id)
                db.session.add(prof)
            prof.full_name = full_name or user.username
            prof.age = age; prof.gender = gender; prof.height = height; prof.weight = weight
            prof.activity_level = activity; prof.goal = goal
            prof.bmi = m['bmi']; prof.bmr = m['bmr']; prof.tdee = m['tdee']
            prof.calorie_target = m['calorie_target']
            db.session.commit()
            log_activity(f"Updated profile: Goal set to {goal}", user.id, user.username)
            flash('Profile saved successfully! ✅', 'success')
            return redirect(url_for('dashboard'))
        except (ValueError, KeyError) as e:
            flash(str(e) or 'Invalid values.', 'danger')
    return render_template('profile.html', user=user, profile=prof)

# ══════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════
@app.route('/dashboard')
@login_required
def dashboard():
    user = current_user()
    prof = user.profile
    if not prof:
        flash('Complete your profile to see your dashboard.', 'info')
        return redirect(url_for('profile'))
    today       = datetime.date.today()
    today_meals = (Meal.query.filter_by(user_id=user.id, meal_date=today)
                .order_by(Meal.logged_at.desc()).all())
    
    analytics = AnalyticsService.get_dashboard_data(user.id)
    consumed = analytics['consumed']
    cal_target = analytics['target']
    remaining = max(0, cal_target - consumed)
    cal_pct = min(100, round(consumed / cal_target * 100)) if cal_target else 0

    net_balance = analytics['net_balance']
    forecast = analytics['forecast']

    # Optimized weekly calorie query: Fetch sums for the last 7 days in a single query
    weekly_data_raw = db.session.query(
        Meal.meal_date,
        db.func.sum(Meal.calories)
    ).filter(
        Meal.user_id == user.id,
        Meal.meal_date >= today - datetime.timedelta(days=6), # Last 7 days including today
        Meal.meal_date <= today
    ).group_by(Meal.meal_date).order_by(Meal.meal_date).all()

    # Create a dictionary for quick lookup and fill in missing days with 0
    weekly_map = {d.strftime('%Y-%m-%d'): cals for d, cals in weekly_data_raw}
    weekly = [{'day': (today - datetime.timedelta(days=i)).strftime('%a'),
            'calories': weekly_map.get((today - datetime.timedelta(days=i)).strftime('%Y-%m-%d'), 0)}
            for i in range(6, -1, -1)] # Iterate backwards to get most recent day last
    
    bmi = float(prof.bmi or 0)
    bmi_percentage = bmi_pct(bmi) # Calculate bmi_pct using the helper function
    m   = calc_metrics(prof.weight, prof.height, prof.age,
                    prof.gender, prof.activity_level, prof.goal) if prof.weight else {
        'bmi': bmi, 'bmi_category': 'Unknown', 'bmi_color': '#64748B', 'bmi_bg': '#F8FAFC', # Fallback for profile not set
        'calorie_target': cal_target
    }
    goal_labels = {'lose': 'Lose Weight', 'maintain': 'Maintain Weight', 'gain': 'Gain Weight'}
    return render_template('dashboard.html',
        user=user, profile=prof,
        metrics=m, bmi_pct=bmi_percentage, # Pass the calculated bmi_percentage
        today_meals=today_meals,
        calories_consumed=consumed, calories_remaining=remaining,
        cal_pct=cal_pct, cal_target=cal_target,
        weekly=weekly,
        net_balance=int(net_balance),
        forecast=forecast,
        goal_label=goal_labels.get(prof.goal, 'Health Goal'),
        today=today.strftime('%A, %B %d'),
    )

# ══════════════════════════════════════════════════════
# ADMIN SYSTEM
# ══════════════════════════════════════════════════════
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password')
        admin = Admin.query.filter_by(username=username).first()
        
        if admin and admin.check_password(password):
            session['admin_id'] = admin.id
            admin.last_login = datetime.datetime.utcnow()
            db.session.commit()
            log_activity(f"Admin logged in: {username}", admin.id, f"Admin:{username}")
            return redirect(url_for('admin_dashboard'))
        flash('Invalid administrator credentials.', 'danger')
    return render_template('admin/login.html')

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    stats = {
        'users': User.query.count(),
        'active': User.query.filter_by(is_active=True).count(),
        'meals': Meal.query.count(),
        'reminders': Reminder.query.count()
    }
    recent_logs = AuditLog.query.order_by(desc(AuditLog.timestamp)).limit(10).all()
    return render_template('admin/dashboard.html', stats=stats, logs=recent_logs)

@app.route('/admin/users')
@admin_required
def admin_users():
    q = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    if q:
        query = User.query.filter((User.username.ilike(f'%{q}%')) | (User.email.ilike(f'%{q}%')))
    else:
        query = User.query
    pagination = query.paginate(page=page, per_page=15, error_out=False)
    return render_template('admin/users.html', users=pagination.items, pagination=pagination, q=q)

@app.route('/admin/users/edit/<int:uid>', methods=['GET', 'POST'])
@admin_required
def admin_edit_user(uid):
    user = User.query.get_or_404(uid)
    profile = user.profile
    if request.method == 'POST':
        try:
            if not profile:
                profile = Profile(user_id=user.id)
                db.session.add(profile)
            
            profile.full_name = request.form.get('full_name', '').strip()
            profile.age = int(request.form.get('age') or 0)
            profile.gender = request.form.get('gender', '')
            profile.height = float(request.form.get('height') or 0.0)
            profile.weight = float(request.form.get('weight') or 0.0)
            profile.activity_level = request.form.get('activity_level', 'moderate')
            profile.goal = request.form.get('goal', 'maintain')

            if profile.weight and profile.height and profile.age and profile.gender:
                m = calc_metrics(profile.weight, profile.height, profile.age,
                                profile.gender, profile.activity_level, profile.goal)
                for key in ['bmi', 'bmr', 'tdee', 'calorie_target']:
                    setattr(profile, key, m[key])

            db.session.commit()
            log_activity(f"Admin updated user: {user.username} (ID: {user.id})", session['admin_id'], "Admin")
            flash(f"User {user.username} details updated successfully.", 'success')
            return redirect(url_for('admin_users'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating user: {str(e)}", 'danger')
    return render_template('admin/edit_user.html', user=user, profile=profile)

@app.route('/admin/foods', methods=['GET', 'POST'])
@admin_required
def admin_foods():
    page = request.args.get('page', 1, type=int)
    q = request.args.get('q', '').strip() or ''
    category = request.args.get('category', '').strip() or ''
    
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            cals = float(request.form.get('calories') or 0)
            cat  = request.form.get('category', 'General')
            size = request.form.get('serving_size', '100g')
            
            if cals < 0:
                flash("Calories cannot be negative.", "danger")
            else:
                existing = GlobalFood.query.filter(db.func.lower(GlobalFood.name) == db.func.lower(name)).first()
                if existing:
                    flash(f"'{name}' already exists in the global database.", "warning")
                else:
                    food = GlobalFood(
                        name=name, 
                        calories_per_100g=cals, 
                        category=cat, 
                        serving_size=size
                    )
                    db.session.add(food)
                    db.session.commit()
                    flash(f"Added {name} to system database.", "success")
        except ValueError:
            flash("Invalid input for calories.", "danger")
    
    query = GlobalFood.query
    if q:
        query = query.filter(GlobalFood.name.ilike(f'%{q}%'))
    if category:
        query = query.filter(GlobalFood.category == category)
        
    pagination = query.order_by(GlobalFood.name).paginate(page=page, per_page=15, error_out=False)
    return render_template('admin/foods.html', foods=pagination.items, 
                        pagination=pagination, q=q, current_category=category)

@app.route('/admin/foods/edit/<int:fid>', methods=['GET', 'POST'])
@admin_required
def admin_edit_food(fid):
    food = GlobalFood.query.get_or_404(fid)
    if request.method == 'POST':
        try:
            name = request.form.get('name', '').strip()
            calories = float(request.form.get('calories') or 0)
            category = request.form.get('category', 'General')
            serving_size = request.form.get('serving_size', '100g')

            if not name: raise ValueError("Food name cannot be empty.")
            if calories < 0: raise ValueError("Calories cannot be negative.")

            food.name = name
            food.calories_per_100g = calories
            food.category = category
            food.serving_size = serving_size
            db.session.commit()
            log_activity(f"Admin updated food item: {food.name} (ID: {food.id})", session['admin_id'], "Admin")
            flash(f"Food item '{food.name}' updated successfully.", 'success')
            return redirect(url_for('admin_foods'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating food item: {str(e)}", 'danger')
    return render_template('admin/edit_food.html', food=food)

@app.route('/admin/foods/delete/<int:fid>', methods=['POST'])
@admin_required
def admin_delete_food(fid):
    food = GlobalFood.query.get_or_404(fid)
    food_name = food.name
    db.session.delete(food)
    db.session.commit()
    log_activity(f"Admin deleted food item: {food_name} (ID: {fid})", session['admin_id'], "Admin")
    flash(f"Food item '{food_name}' removed.", "info")
    return redirect(url_for('admin_foods'))

@app.route('/admin/users/toggle/<int:uid>', methods=['POST'])
@admin_required
def admin_toggle_user(uid):
    user = User.query.get_or_404(uid)
    user.is_active = not user.is_active
    db.session.commit()
    log_activity(
        f"Admin {'deactivated' if not user.is_active else 'activated'} user: {user.username} (ID: {user.id})",
        session['admin_id'],
        "Admin"
    )
    flash(f"User {user.username} has been {'deactivated' if not user.is_active else 'activated'}.", 'success')
    return redirect(url_for('admin_users'))

@app.route('/admin/users/delete/<int:uid>', methods=['POST'])
@admin_required
def admin_delete_user(uid):
    user = User.query.get_or_404(uid)
    username = user.username
    db.session.delete(user)
    db.session.commit()
    log_activity(f"Admin deleted user: {username} (ID: {uid})", session['admin_id'], "Admin")
    flash(f"User '{username}' has been deleted.", "info")
    return redirect(url_for('admin_users'))

@app.route('/admin/logs')
@admin_required
def admin_logs():
    page = request.args.get('page', 1, type=int)
    actor_filter = request.args.get('actor', '')
    role_filter = request.args.get('role', '')
    action_filter = request.args.get('action', '')

    query = AuditLog.query
    if actor_filter:
        query = query.filter(AuditLog.actor_name.ilike(f'%{actor_filter}%'))
    if role_filter:
        query = query.filter(AuditLog.role == role_filter)
    if action_filter:
        query = query.filter(AuditLog.action.ilike(f'%{action_filter}%'))
        
    pagination = query.order_by(desc(AuditLog.timestamp)).paginate(page=page, per_page=15, error_out=False)
    return render_template('admin/logs.html', logs=pagination.items, pagination=pagination, q_actor=actor_filter, q_action=action_filter)

@app.route('/admin/foods/export')
@admin_required
def admin_export_foods():
    csv_data = FoodService.export_csv()
    return send_file(
        io.BytesIO(csv_data.encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='global_foods.csv'
    )

@app.route('/admin/foods/import', methods=['POST'])
@admin_required
def admin_import_foods():
    if 'csv_file' not in request.files: return redirect(url_for('admin_foods'))
    added = FoodService.import_csv(request.files['csv_file'])
    flash(f"Successfully imported {added} food items.", "success")
    return redirect(url_for('admin_foods'))
@app.route('/admin/backup')
@admin_required
def admin_backup():
    backup_file = BackupService.perform_backup(session['admin_id'])
    log_activity(f"System Backup created: {backup_file}", session['admin_id'], "Admin")
    flash(f"Backup created: {backup_file}", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/backup/download')
@admin_required
def admin_backup_download():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backup_path = os.path.join(base_dir, 'backups', 'backup.json')
    if not os.path.exists(backup_path):
        flash("Backup file does not exist. Please generate a backup first.", "danger")
        return redirect(url_for('admin_dashboard'))
    
    return send_file(backup_path, as_attachment=True, download_name='backup.json')

@app.route('/admin/restore', methods=['GET', 'POST'])
@role_required(['superadmin'])
def admin_restore():
    if request.method == 'POST':
        if 'backup_file' not in request.files: return redirect(request.url)
        file = request.files['backup_file']
        if file and file.filename.endswith('.json'):
            try:
                summary = BackupService.restore_from_json(file, session['admin_id'])
                flash(f'System Restore Successful: {summary}', 'success')
                return redirect(url_for('admin_dashboard'))
            except Exception as e:
                flash(f"Error restoring database: {str(e)}", 'danger')
    return render_template('admin/restore.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_id', None)
    return redirect(url_for('admin_login'))

@app.route('/admin/api/user-growth')
@admin_required
def admin_user_growth_data():
    # Get user registrations grouped by date
    # This is a simplified approach, for large datasets, consider pre-aggregating
    user_registrations = db.session.query(
        db.func.date(User.created_at),
        db.func.count(User.id)
    ).group_by(db.func.date(User.created_at)).order_by(db.func.date(User.created_at)).all()

    labels = [row[0] for row in user_registrations]
    data = [row[1] for row in user_registrations]

    return jsonify({'labels': labels, 'data': data})

@app.route('/api/food-search')
@login_required
def api_food_search():
    q = request.args.get('q', '').strip()
    if not q or len(q) < 1:
        return jsonify([])
    foods = GlobalFood.query.filter(GlobalFood.name.ilike(f'%{q}%')).limit(15).all()
    return jsonify([{'name': f.name, 'calories': f.calories_per_100g, 'source': 'global'} for f in foods])

@app.route('/meals')
@login_required
def meals():
    user  = current_user()
    prof  = user.profile
    today = datetime.date.today()
    today_meals = (Meal.query.filter_by(user_id=user.id, meal_date=today)
                .order_by(Meal.logged_at.asc()).all())
    groups = {'breakfast':[], 'lunch':[], 'snack':[], 'dinner':[], 'other':[]}
    for m in today_meals:
        groups[m.meal_type if m.meal_type in groups else 'other'].append(m)
    consumed   = int(sum(m.calories for m in today_meals))
    cal_target = prof.calorie_target if prof else 2000
    remaining  = max(0, cal_target - consumed)
    cal_pct    = min(100, round(consumed / cal_target * 100)) if cal_target else 0
    suggestions = get_suggestions(user.id)
    history     = (FoodHistory.query.filter_by(user_id=user.id)
                .order_by(FoodHistory.frequency.desc()).all())
    return render_template('meals.html',
        user=user, profile=prof,
        groups=groups, today_meals=today_meals,
        calories_consumed=consumed, calories_remaining=remaining,
        cal_pct=cal_pct, cal_target=cal_target,
        suggestions=suggestions,
        history=[{'id': h.id, 'name': h.food_name, 'calories': h.calories, 'source': 'history'} for h in history],
        current_meal_type=get_meal_type_now(),
        today=today.strftime('%A, %B %d'),
    )

@app.route('/meals/add', methods=['POST'])
@login_required
def add_meal():
    user, data = current_user(), (request.get_json() or {})
    try:
        f_name = data.get('food_name', '').strip()
        cals   = float(data.get('calories', 0))
        weight = float(data.get('weight', 100))
        m_type = data.get('meal_type', get_meal_type_now())
        if not f_name: raise ValueError('Food name required.')

        # Link to global food if it exists in DB
        gf = GlobalFood.query.filter_by(name=f_name).first()
        gf_id = gf.id if gf else None

        base = gf.calories_per_100g if gf else (cals / weight) * 100
        if gf: cals = round((base / 100.0) * weight, 1)

        if cals <= 0: raise ValueError('Calories must be > 0.')

        meal = Meal(
            user_id=user.id, 
            food_name=f_name, 
            calories=cals, 
            weight_grams=weight, 
            meal_type=m_type,
            global_food_id=gf_id
        )
        db.session.add(meal)
        upsert_history(user.id, f_name, base)
        db.session.commit()
        return jsonify({'success': True, 'meal_id': meal.id, 'food_name': meal.food_name, 
                        'calories': meal.calories, 'meal_type': meal.meal_type,
                        'logged_at': meal.logged_at.strftime('%I:%M %p')})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/meals/delete/<int:meal_id>', methods=['DELETE'])
@login_required
def delete_meal(meal_id):
    user = current_user()
    meal = Meal.query.filter_by(id=meal_id, user_id=user.id).first_or_404()
    calories = meal.calories
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'success': True, 'calories': calories})

@app.route('/meals/history/delete/<int:hid>', methods=['DELETE'])
@login_required
def delete_history_item(hid):
    user = current_user()
    item = FoodHistory.query.filter_by(id=hid, user_id=user.id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/reminders')
@login_required
def reminders():
    user    = current_user()
    all_rem = sorted(Reminder.query.filter_by(user_id=user.id).all(),
                    key=lambda r: r.sort_key)
    active   = [r for r in all_rem if r.is_active]
    inactive = [r for r in all_rem if not r.is_active]
    upcoming = [r for r in active if r.is_upcoming]
    past     = [r for r in active if not r.is_upcoming]
    return render_template('reminders.html',
        user=user, upcoming=upcoming, past=past,
        inactive=inactive, total=len(all_rem))

@app.route('/reminders/add', methods=['POST'])
@login_required
def add_reminder():
    user = current_user()
    try:
        r_type = request.form.get('reminder_type')
        label  = request.form.get('label')
        hour   = int(request.form.get('hour', 8))
        minute = int(request.form.get('minute', 0))
        ampm   = request.form.get('ampm', 'AM')

        interval = 0
        repeat_times = int(request.form.get('repeat_times', 1))

        if r_type == 'water':
            interval = int(request.form.get('interval_hours', 0))
            repeat_times = int(request.form.get('repeat_count', 1))

        rem = Reminder(
            user_id=user.id,
            reminder_type=r_type,
            label=label,
            hour=hour,
            minute=minute,
            ampm=ampm,
            repeat_times=repeat_times,
            interval=interval,
            medicine_name=request.form.get('medicine_name', ''),
            dosage=request.form.get('dosage', '')
        )
        db.session.add(rem)
        db.session.commit()
        log_activity(f"Added {r_type} reminder: {label}", user.id, user.username)
        flash('Reminder added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding reminder: {str(e)}', 'danger')
    return redirect(url_for('reminders'))

@app.route('/reminders/delete/<int:rid>', methods=['POST'])
@login_required
def delete_reminder(rid):
    user = current_user()
    rem = Reminder.query.filter_by(id=rid, user_id=user.id).first_or_404()
    label = rem.label
    db.session.delete(rem)
    db.session.commit()
    log_activity(f"Deleted reminder: {label}", user.id, user.username)
    flash('Reminder deleted.', 'info')
    return redirect(url_for('reminders'))

@app.route('/reminders/toggle/<int:rid>', methods=['POST'])
@login_required
def toggle_reminder(rid):
    user = current_user()
    rem  = Reminder.query.filter_by(id=rid, user_id=user.id).first_or_404()
    rem.is_active = not rem.is_active
    db.session.commit()
    return jsonify({'success': True, 'is_active': rem.is_active})

@app.route('/api/reminders/check')
@login_required
def check_reminders_due():
    user = current_user()
    now  = datetime.datetime.now()
    due  = []
    for r in Reminder.query.filter_by(user_id=user.id, is_active=True).all():
        if r.hour_24 == now.hour and r.minute == now.minute:
            due.append({'id': r.id, 'label': r.label, 'type': r.reminder_type,
                        'icon': r.type_icon, 'medicine': r.medicine_name,
                        'dosage': r.dosage, 'time': r.time_display})
    return jsonify(due)

@app.route('/api/reminders/log', methods=['POST'])
@login_required
def log_reminder_engagement():
    data = request.get_json() or {}
    rid = data.get('reminder_id')
    if rid:
        db.session.add(ReminderLog(reminder_id=rid, status=data.get('status', 'missed')))
        db.session.commit()
    return jsonify({'success': True})

# ══════════════════════════════════════════════════════
# API
# ══════════════════════════════════════════════════════

@app.route('/api/calculate', methods=['POST'])
def api_calculate():
    data = request.get_json() or {}
    try:
        result = calc_metrics(float(data['weight']), float(data['height']),
                            int(data['age']), data['gender'],
                            data['activity_level'], data['goal'])
        return jsonify({'success': True, **result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

def seed_global_foods():
    """Seeds the global_foods table with diverse items (70% Filipino, 30% Global)."""
    foods = [
        {'name': 'Steamed White Rice (1 cup)', 'calories': 205, 'category': 'Rice & Grains'},
        {'name': 'Sinangag (Garlic Rice - 1 cup)', 'calories': 220, 'category': 'Rice & Grains'},
        {'name': 'Champorado (1 bowl)', 'calories': 280, 'category': 'Rice & Grains'},
        {'name': 'Arroz Caldo (Chicken - 1 bowl)', 'calories': 220, 'category': 'Rice & Grains'},
        {'name': 'Whole Wheat Bread (1 slice)', 'calories': 80, 'category': 'Rice & Grains'},
        {'name': 'Pandesal (1 medium pc)', 'calories': 100, 'category': 'Rice & Grains'},
        {'name': 'Chicken Adobo', 'calories': 350, 'category': 'Meat Dishes'},
        {'name': 'Pork Adobo', 'calories': 420, 'category': 'Meat Dishes'},
        {'name': 'Beef Caldereta', 'calories': 450, 'category': 'Meat Dishes'},
        {'name': 'Lechon Kawali (100g)', 'calories': 450, 'category': 'Meat Dishes'},
        {'name': 'Pork Sisig', 'calories': 400, 'category': 'Meat Dishes'},
        {'name': 'Sinigang na Baboy', 'calories': 350, 'category': 'Vegetables & Soups'},
        {'name': 'Tinolang Manok', 'calories': 220, 'category': 'Vegetables & Soups'},
        {'name': 'Halo-Halo (Regular)', 'calories': 450, 'category': 'Snacks & Desserts'},
        {'name': 'Leche Flan (1 slice)', 'calories': 220, 'category': 'Snacks & Desserts'},
        {'name': 'Taho (1 cup)', 'calories': 180, 'category': 'Snacks & Desserts'},
        {'name': 'Black Coffee (No Sugar)', 'calories': 2, 'category': 'Beverages'},
        {'name': 'Green Tea (Unsweetened)', 'calories': 0, 'category': 'Beverages'},
    ]
    for f in foods:
        if not GlobalFood.query.filter_by(name=f['name']).first():
            db.session.add(GlobalFood(name=f['name'], calories_per_100g=f['calories'], category=f['category']))
    db.session.commit()

def run_migrations():
    """Hot-fixes for schema updates using engine.begin() for atomic transactions."""
    with db.engine.begin() as conn:
        inspector = db.inspect(conn)
        tables = inspector.get_table_names()

        if 'users' in tables:
            cols = [c['name'] for c in inspector.get_columns('users')]
            if 'is_active' not in cols: conn.execute(db.text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            if 'role' not in cols: conn.execute(db.text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
            if 'coach_id' not in cols: conn.execute(db.text("ALTER TABLE users ADD COLUMN coach_id INTEGER"))
            if 'created_at' not in cols: conn.execute(db.text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            if 'firebase_uid' not in cols: conn.execute(db.text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128)"))

        if 'admins' in tables:
            cols = [c['name'] for c in inspector.get_columns('admins')]
            if 'role' not in cols: conn.execute(db.text("ALTER TABLE admins ADD COLUMN role VARCHAR(20) DEFAULT 'superadmin'"))
            if 'last_login' not in cols: conn.execute(db.text("ALTER TABLE admins ADD COLUMN last_login DATETIME"))

        if 'global_foods' in tables:
            cols = [c['name'] for c in inspector.get_columns('global_foods')]
            if 'calories_per_100g' not in cols:
                if 'calories' in cols: conn.execute(db.text("ALTER TABLE global_foods RENAME COLUMN calories TO calories_per_100g"))
                else: conn.execute(db.text("ALTER TABLE global_foods ADD COLUMN calories_per_100g FLOAT DEFAULT 0.0"))
            
            cols = [c['name'] for c in inspector.get_columns('global_foods')]
            if 'serving_size' not in cols: conn.execute(db.text("ALTER TABLE global_foods ADD COLUMN serving_size VARCHAR(50) DEFAULT '100g'"))
            if 'category' not in cols: conn.execute(db.text("ALTER TABLE global_foods ADD COLUMN category VARCHAR(50) DEFAULT 'General'"))

        if 'meals' in tables:
            cols = [c['name'] for c in inspector.get_columns('meals')]
            if 'weight_grams' not in cols: conn.execute(db.text("ALTER TABLE meals ADD COLUMN weight_grams FLOAT DEFAULT 100.0"))
            if 'global_food_id' not in cols: conn.execute(db.text("ALTER TABLE meals ADD COLUMN global_food_id INTEGER"))

        if 'reminders' in tables:
            cols = [c['name'] for c in inspector.get_columns('reminders')]
            if 'interval' not in cols: conn.execute(db.text("ALTER TABLE reminders ADD COLUMN interval INTEGER DEFAULT 0"))
            if 'medicine_name' not in cols: conn.execute(db.text("ALTER TABLE reminders ADD COLUMN medicine_name VARCHAR(120) DEFAULT ''"))
            if 'dosage' not in cols: conn.execute(db.text("ALTER TABLE reminders ADD COLUMN dosage VARCHAR(80) DEFAULT ''"))

        if 'audit_logs' in tables:
            cols = [c['name'] for c in inspector.get_columns('audit_logs')]
            if 'role' not in cols: conn.execute(db.text("ALTER TABLE audit_logs ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
            if 'ip_address' not in cols: conn.execute(db.text("ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45)"))

        if 'backup_logs' in tables:
            cols = [c['name'] for c in inspector.get_columns('backup_logs')]
            if 'status' not in cols: conn.execute(db.text("ALTER TABLE backup_logs ADD COLUMN status VARCHAR(20) DEFAULT 'Success'"))
            if 'details' not in cols: conn.execute(db.text("ALTER TABLE backup_logs ADD COLUMN details TEXT"))
            if 'admin_id' not in cols: conn.execute(db.text("ALTER TABLE backup_logs ADD COLUMN admin_id INTEGER"))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        run_migrations()
        seed_global_foods()
        
        if not Admin.query.filter_by(username='admin').first():
            default_admin = Admin(username='admin')
            default_admin.set_password('admin123')
            db.session.add(default_admin)
            db.session.commit()
            print("System ready: Default admin user 'admin' created.")
        else:
            print("System ready: Admin account verified.")

    app.run(debug=True, port=5000)