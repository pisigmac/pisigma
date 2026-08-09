"""CLI entrypoint."""

from __future__ import annotations

import uvicorn

from pisigma_auth.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "pisigma_auth.app:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )


if __name__ == "__main__":
    main()
