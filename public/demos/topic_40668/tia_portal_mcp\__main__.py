"""Entry point for `python -m tia_portal_mcp`"""
import asyncio
from .server import main
asyncio.run(main())
