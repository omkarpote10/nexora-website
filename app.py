from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash, Response
import sqlite3
import json
import os
import smtplib
from email.message import EmailMessage
from datetime import datetime
from functools import wraps
from urllib.parse import quote
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.secret_key = os.environ.get("NEXORA_SECRET_KEY", "change-this-in-production")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("NEXORA_HTTPS", "0") == "1",
    MAX_CONTENT_LENGTH=2 * 1024 * 1024
)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "nexora.db")

ADMIN_USER = os.environ.get("NEXORA_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("NEXORA_ADMIN_PASS", "nexora123")

# Optional email notification settings.
SMTP_HOST = os.environ.get("NEXORA_SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("NEXORA_SMTP_PORT", "587"))
SMTP_USER = os.environ.get("NEXORA_SMTP_USER", "")
SMTP_PASS = os.environ.get("NEXORA_SMTP_PASS", "")
SMTP_FROM = os.environ.get("NEXORA_SMTP_FROM", SMTP_USER)
LEAD_NOTIFY_EMAIL = os.environ.get("NEXORA_LEAD_NOTIFY_EMAIL", "")
SITE_URL = os.environ.get("NEXORA_SITE_URL", "http://127.0.0.1:5000").rstrip("/")
CONTACT_EMAIL = os.environ.get("NEXORA_CONTACT_EMAIL", "hello@nexora.example")
CONTACT_PHONE = os.environ.get("NEXORA_CONTACT_PHONE", "")
WHATSAPP_NUMBER = os.environ.get("NEXORA_WHATSAPP_NUMBER", "")


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT NOT NULL,
            goal TEXT NOT NULL,
            features TEXT,
            notes TEXT,
            budget TEXT,
            budget_mode TEXT,
            timeline TEXT,
            launch_date TEXT,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT NOT NULL,
            phone TEXT,
            preferred TEXT,
            status TEXT DEFAULT 'new',
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lead_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enquiry_id INTEGER NOT NULL,
            note TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lead_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enquiry_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

init_db()

def add_activity(enquiry_id, activity_type, description):
    conn = db()
    conn.execute(
        "INSERT INTO lead_activity (enquiry_id, activity_type, description, created_at) VALUES (?, ?, ?, ?)",
        (enquiry_id, activity_type, description, datetime.now().isoformat(timespec="seconds"))
    )
    conn.commit()
    conn.close()

def send_new_lead_email(lead):
    """Best-effort notification. If SMTP is not configured, silently skip."""
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS and LEAD_NOTIFY_EMAIL):
        return False, "SMTP not configured"

    try:
        msg = EmailMessage()
        msg["Subject"] = f"New Nexora lead: {lead['name']} — {lead['service']}"
        msg["From"] = SMTP_FROM
        msg["To"] = LEAD_NOTIFY_EMAIL

        features = ", ".join(lead.get("features", [])) or "Not specified"
        body = f"""A new project enquiry has arrived.

Client: {lead['name']}
Company: {lead.get('company') or 'Not provided'}
Email: {lead['email']}
Phone: {lead.get('phone') or 'Not provided'}
Preferred contact: {lead.get('preferred') or 'Email'}

Project type: {lead['service']}
Goal:
{lead['goal']}

Features:
{features}

Budget: {lead.get('budget') or 'Not provided'}
Budget preference: {lead.get('budgetMode') or 'Not provided'}
Timeline: {lead.get('timeline') or 'Not provided'}
Launch date: {lead.get('launchDate') or 'Not provided'}

Additional notes:
{lead.get('notes') or 'None'}

Open the Nexora admin dashboard to review the lead.
"""
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
        return True, "sent"
    except Exception as exc:
        return False, str(exc)


@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    return response

@app.context_processor
def inject_site_config():
    return {
        "site_url": SITE_URL,
        "contact_email": CONTACT_EMAIL,
        "contact_phone": CONTACT_PHONE,
        "whatsapp_number": WHATSAPP_NUMBER,
    }

@app.get("/privacy")
def privacy():
    return render_template("privacy.html")

@app.get("/terms")
def terms():
    return render_template("terms.html")

@app.get("/robots.txt")
def robots():
    body = f"""User-agent: *
Allow: /
Disallow: /admin/
Sitemap: {SITE_URL}/sitemap.xml
"""
    return Response(body, mimetype="text/plain")

@app.get("/sitemap.xml")
def sitemap():
    pages = [
        ("", "1.0"),
        ("/services", "0.9"),
        ("/work", "0.9"),
        ("/about", "0.8"),
        ("/contact", "0.9"),
        ("/privacy", "0.3"),
        ("/terms", "0.3"),
    ]
    urls = "".join(
        f"<url><loc>{SITE_URL}{path}</loc><changefreq>monthly</changefreq><priority>{priority}</priority></url>"
        for path, priority in pages
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(xml, mimetype="application/xml")

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "nexora"})

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/services")
def services():
    return render_template("services.html")

@app.get("/work")
def work():
    return render_template("work.html")

@app.get("/about")
def about():
    return render_template("about.html")

@app.get("/contact")
def contact():
    return render_template("contact.html")

@app.get("/<page>.html")
def html_page(page):
    mapping = {
        "index": "index.html",
        "services": "services.html",
        "work": "work.html",
        "about": "about.html",
        "contact": "contact.html",
    }
    if page not in mapping:
        return "Not found", 404
    return render_template(mapping[page])

@app.post("/api/enquiries")
def create_enquiry():
    data = request.get_json(silent=True) or {}

    # Honeypot field for basic bot filtering.
    if str(data.get("website", "")).strip():
        return jsonify({"ok": True}), 201

    required = ["service", "goal", "name", "email"]
    missing = [f for f in required if not str(data.get(f, "")).strip()]
    if missing:
        return jsonify({"error": "Missing required fields: " + ", ".join(missing)}), 400

    email = str(data.get("email", "")).strip()
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 400

    conn = db()
    cur = conn.execute("""
        INSERT INTO enquiries (
            service, goal, features, notes, budget, budget_mode,
            timeline, launch_date, name, company, email, phone,
            preferred, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
    """, (
        str(data.get("service", "")).strip(),
        str(data.get("goal", "")).strip(),
        json.dumps(data.get("features", [])),
        str(data.get("notes", "")).strip(),
        str(data.get("budget", "")).strip(),
        str(data.get("budgetMode", "")).strip(),
        str(data.get("timeline", "")).strip(),
        str(data.get("launchDate", "")).strip(),
        str(data.get("name", "")).strip(),
        str(data.get("company", "")).strip(),
        email,
        str(data.get("phone", "")).strip(),
        str(data.get("preferred", "")).strip(),
        datetime.now().isoformat(timespec="seconds")
    ))
    conn.commit()
    enquiry_id = cur.lastrowid
    conn.close()

    add_activity(enquiry_id, "created", "Lead submitted a new project enquiry.")

    email_sent, email_message = send_new_lead_email(data)
    if email_sent:
        add_activity(enquiry_id, "notification", "New-lead email notification sent to Nexora.")
    else:
        add_activity(enquiry_id, "notification", f"Email notification skipped/failed: {email_message}")

    return jsonify({"ok": True, "id": enquiry_id, "notification_sent": email_sent}), 201

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return fn(*args, **kwargs)
    return wrapper

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        user = request.form.get("username", "")
        password = request.form.get("password", "")
        if user == ADMIN_USER and password == ADMIN_PASS:
            session["admin"] = True
            return redirect(url_for("admin_leads"))
        error = "Invalid username or password."
    return render_template("admin_login.html", error=error)

@app.get("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))

@app.get("/admin")
@admin_required
def admin_leads():
    q = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()

    sql = "SELECT * FROM enquiries WHERE 1=1"
    params = []

    if q:
        sql += " AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR service LIKE ?)"
        like = f"%{q}%"
        params += [like, like, like, like]

    if status:
        sql += " AND status = ?"
        params.append(status)

    sql += " ORDER BY id DESC"

    conn = db()
    leads = conn.execute(sql, params).fetchall()
    stats = {
        "total": conn.execute("SELECT COUNT(*) FROM enquiries").fetchone()[0],
        "new": conn.execute("SELECT COUNT(*) FROM enquiries WHERE status='new'").fetchone()[0],
        "contacted": conn.execute("SELECT COUNT(*) FROM enquiries WHERE status='contacted'").fetchone()[0],
        "qualified": conn.execute("SELECT COUNT(*) FROM enquiries WHERE status='qualified'").fetchone()[0],
        "won": conn.execute("SELECT COUNT(*) FROM enquiries WHERE status='won'").fetchone()[0],
    }
    conn.close()

    return render_template("admin.html", leads=leads, stats=stats, q=q, status=status, json=json)

@app.get("/admin/enquiry/<int:lead_id>")
@admin_required
def lead_detail(lead_id):
    conn = db()
    lead = conn.execute("SELECT * FROM enquiries WHERE id=?", (lead_id,)).fetchone()
    if not lead:
        conn.close()
        return "Lead not found", 404

    notes = conn.execute(
        "SELECT * FROM lead_notes WHERE enquiry_id=? ORDER BY id DESC", (lead_id,)
    ).fetchall()
    activity = conn.execute(
        "SELECT * FROM lead_activity WHERE enquiry_id=? ORDER BY id DESC", (lead_id,)
    ).fetchall()
    conn.close()

    phone_digits = "".join(ch for ch in (lead["phone"] or "") if ch.isdigit())
    wa_text = quote(
        f"Hi {lead['name']}, this is Nexora. Thanks for your enquiry about {lead['service']}. "
        "I’d like to discuss your project requirements."
    )
    whatsapp_url = f"https://wa.me/{phone_digits}?text={wa_text}" if phone_digits else ""
    mailto_subject = quote(f"Nexora — {lead['service']} project")
    mailto_body = quote(
        f"Hi {lead['name']},\n\nThanks for contacting Nexora about your {lead['service']} project.\n\n"
        "I’d like to discuss your requirements and next steps.\n\nRegards,\nNexora"
    )
    mailto_url = f"mailto:{lead['email']}?subject={mailto_subject}&body={mailto_body}"

    features = json.loads(lead["features"]) if lead["features"] else []

    return render_template(
        "lead_detail.html",
        lead=lead,
        notes=notes,
        activity=activity,
        features=features,
        whatsapp_url=whatsapp_url,
        mailto_url=mailto_url
    )

@app.post("/admin/enquiry/<int:lead_id>/status")
@admin_required
def update_status(lead_id):
    status = request.form.get("status", "new")
    allowed = {"new", "contacted", "qualified", "won", "lost"}
    if status not in allowed:
        status = "new"

    conn = db()
    old = conn.execute("SELECT status FROM enquiries WHERE id=?", (lead_id,)).fetchone()
    conn.execute("UPDATE enquiries SET status=? WHERE id=?", (status, lead_id))
    conn.commit()
    conn.close()

    old_status = old["status"] if old else "unknown"
    if old_status != status:
        add_activity(lead_id, "status", f"Lead status changed from {old_status.title()} to {status.title()}.")

    return redirect(request.referrer or url_for("admin_leads"))

@app.post("/admin/enquiry/<int:lead_id>/note")
@admin_required
def add_note(lead_id):
    note = request.form.get("note", "").strip()
    if note:
        conn = db()
        conn.execute(
            "INSERT INTO lead_notes (enquiry_id, note, created_at) VALUES (?, ?, ?)",
            (lead_id, note, datetime.now().isoformat(timespec="seconds"))
        )
        conn.commit()
        conn.close()
        add_activity(lead_id, "note", "Admin added a private note.")
    return redirect(url_for("lead_detail", lead_id=lead_id))

@app.post("/admin/enquiry/<int:lead_id>/activity")
@admin_required
def log_manual_activity(lead_id):
    description = request.form.get("description", "").strip()
    if description:
        add_activity(lead_id, "followup", description)
    return redirect(url_for("lead_detail", lead_id=lead_id))

@app.post("/admin/enquiry/<int:lead_id>/delete")
@admin_required
def delete_enquiry(lead_id):
    conn = db()
    conn.execute("DELETE FROM lead_notes WHERE enquiry_id=?", (lead_id,))
    conn.execute("DELETE FROM lead_activity WHERE enquiry_id=?", (lead_id,))
    conn.execute("DELETE FROM enquiries WHERE id=?", (lead_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("admin_leads"))

if __name__ == "__main__":
    app.run(debug=True)
