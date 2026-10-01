import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from notifications.models import push_notification

logger = logging.getLogger(__name__)


def _fire_async(fn, *args, **kwargs):
    threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True).start()


def _send_via_resend(to_email, subject, message):
    """HTTP email API (port 443) — works where SMTP ports are blocked."""
    import requests

    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', '') or 'SwachDrishti <onboarding@resend.dev>'
    resp = requests.post(
        'https://api.resend.com/emails',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json={'from': from_email, 'to': [to_email], 'subject': subject, 'text': message},
        timeout=20,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f'Resend rejected send: {resp.status_code} {resp.text[:200]}')
    logger.info('Email sent via Resend to %s: %s', to_email, subject)


def send_email_safe(to_email, subject, message):
    if not to_email:
        return False

    def _send():
        try:
            if getattr(settings, 'RESEND_API_KEY', ''):
                _send_via_resend(to_email, subject, message)
            else:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email])
                logger.info('Email sent to %s: %s', to_email, subject)
        except Exception as e:
            logger.warning('Email to %s failed (non-fatal): %s', to_email, e)

    _fire_async(_send)
    return True


def send_sms_safe(to_phone, message):
    if not to_phone:
        return False
    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
    if not (sid and token and from_number):
        logger.info('SMS skipped (Twilio not configured) to %s: %s', to_phone, message[:120])
        return False

    def _send():
        try:
            from twilio.rest import Client
            Client(sid, token).messages.create(body=message, from_=from_number, to=to_phone)
            logger.info('SMS sent to %s', to_phone)
        except Exception as e:
            logger.warning('SMS to %s failed (non-fatal): %s', to_phone, e)

    _fire_async(_send)
    return True


def _citizen_contact(report):
    citizen = getattr(report, 'citizen', None)
    email = getattr(citizen, 'email', '') or ''
    phone = getattr(citizen, 'phone', '') or ''
    if citizen:
        name = citizen.get_full_name() or citizen.username
    else:
        name = 'Resident'
    return email, phone, name


def _citizen_user(report):
    user = getattr(report, 'citizen', None)
    return user if user is not None and getattr(user, 'pk', None) else None


def notify_report_submitted(report):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        link = f'{settings.FRONTEND_URL}/citizen'
        subject = f'Report #{report.id} received - {report.title[:60]}'
        body = (
            f'Hi {name},\n\n'
            f'Your report "{report.title}" (#{report.id}) has been received and '
            f'scored {report.priority_level} priority.\n'
            f'Location: {report.address or "pinned on map"}\n\n'
            f'Track it here: {link}\n'
            f'You will also hear from us when the cleanup is ready for your verification.\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti: report #{report.id} received ({report.priority_level} priority). Track: {link}')
        user = _citizen_user(report)
        if user:
            push_notification(user, 'REPORT_SUBMITTED', subject,
                              f'"{report.title}" scored {report.priority_level} priority.', '/citizen')
    except Exception as e:
        logger.warning('notify_report_submitted failed (non-fatal): %s', e)


def notify_verification_required(report):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        link = f'{settings.FRONTEND_URL}/citizen'
        subject = f'Action needed: verify cleanup for report #{report.id}'
        body = (
            f'Hi {name},\n\n'
            f'Good news — our field team has marked "{report.title}" (#{report.id}) as cleaned.\n'
            f'Please confirm the resolution here: {link}\n\n'
            f'If the spot is still dirty, you can reopen it from the same page and '
            f'it will be re-escalated automatically.\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti: report #{report.id} cleaned — please verify: {link}')
        user = _citizen_user(report)
        if user:
            push_notification(user, 'VERIFICATION_REQUIRED', subject,
                              f'"{report.title}" is marked cleaned. Confirm or reopen it.', '/citizen')
    except Exception as e:
        logger.warning('notify_verification_required failed (non-fatal): %s', e)


def notify_verification_outcome(report, is_resolved):
    try:
        email, phone, name = _citizen_contact(report)
        if not (email or phone):
            return
        if is_resolved:
            subject = f'Report #{report.id} closed - thank you'
            body = (
                f'Hi {name},\n\n'
                f'Thanks for verifying "{report.title}" (#{report.id}). '
                f'The case is now closed and +30 impact points were added to your profile.\n\n'
                f'— Team SwachDrishti'
            )
            sms = f'SwachDrishti: report #{report.id} closed. +30 impact points. Thank you!'
        else:
            subject = f'Report #{report.id} reopened and escalated'
            body = (
                f'Hi {name},\n\n'
                f'"{report.title}" (#{report.id}) has been reopened and escalated to '
                f'{report.priority_level} priority. A crew will be re-dispatched shortly.\n\n'
                f'— Team SwachDrishti'
            )
            sms = f'SwachDrishti: report #{report.id} reopened & escalated to {report.priority_level}. Crew re-dispatched.'
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, sms)
        user = _citizen_user(report)
        if user:
            push_notification(user, 'VERIFIED_CLOSED' if is_resolved else 'REOPENED', subject,
                              f'"{report.title}" ' + ('is closed. +30 impact points.' if is_resolved else f'escalated to {report.priority_level}.'),
                              '/citizen')
    except Exception as e:
        logger.warning('notify_verification_outcome failed (non-fatal): %s', e)


def notify_task_assigned(worker, title, link='/worker'):
    try:
        email = getattr(worker, 'email', '') or ''
        phone = getattr(worker, 'phone', '') or ''
        name = worker.get_full_name() or worker.username
        subject = f'New dispatch: {title[:60]}'
        body = (
            f'Hi {name},\n\n'
            f'A new cleanup task was assigned to you: "{title}".\n'
            f'Open your route: {settings.FRONTEND_URL}/worker\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti dispatch: {title[:80]}. Open /worker.')
        push_notification(worker, 'TASK_ASSIGNED', subject,
                          f'"{title}" is waiting on your route.', link)
    except Exception as e:
        logger.warning('notify_task_assigned failed (non-fatal): %s', e)


def notify_pickup_requested(pickup):
    try:
        citizen = getattr(pickup, 'citizen', None)
        if citizen is None or not getattr(citizen, 'pk', None):
            return
        email = getattr(citizen, 'email', '') or ''
        phone = getattr(citizen, 'phone', '') or ''
        name = citizen.get_full_name() or citizen.username
        link = f'{settings.FRONTEND_URL}/citizen'
        subject = f'Pickup #{pickup.pk} requested — {pickup.waste_type}'
        body = (
            f'Hi {name},\n\n'
            f'Your {pickup.waste_type} pickup request (#{pickup.pk}) is received for {pickup.address}.\n'
            f'Track it here: {link}\n\n'
            f'— Team SwachDrishti'
        )
        if email:
            send_email_safe(email, subject, body)
        if phone:
            send_sms_safe(phone, f'SwachDrishti: pickup #{pickup.pk} ({pickup.waste_type}) received.')
        push_notification(citizen, 'PICKUP_UPDATE', subject,
                          f'{pickup.waste_type} pickup at {pickup.address}.', '/citizen')
    except Exception as e:
        logger.warning('notify_pickup_requested failed (non-fatal): %s', e)
