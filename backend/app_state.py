"""
Shared application state — holds loaded ML models so every route
can access them without re-loading.
"""

from typing import Any, Dict

models: Dict[str, Any] = {}
