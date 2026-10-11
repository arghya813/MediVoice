import secrets

from fastapi import Header, HTTPException, status

from .config import settings

PASSCODE_HEADER = "X-Demo-Passcode"


def verify_passcode(
    x_demo_passcode: str | None = Header(default=None, alias=PASSCODE_HEADER),
) -> None:
    """Dependency that requires a valid X-Demo-Passcode header.

    Raises 401 Unauthorized when the header is missing or does not match the
    configured DEMO_PASSCODE. Comparison is constant-time to avoid timing leaks.
    """
    expected = settings.demo_passcode
    provided = x_demo_passcode or ""

    if not expected or not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access restricted. Invalid demo passcode.",
            headers={"WWW-Authenticate": PASSCODE_HEADER},
        )
