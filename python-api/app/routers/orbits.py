"""Compatibilidade: o router oficial reside em app.api.v1.orbits."""
from app.api.v1.orbits import (
    router,
    get_satellite_position,
    get_satellite_position_by_norad,
    simulate_satellite_position,
)

__all__ = [
    "router", "get_satellite_position",
    "get_satellite_position_by_norad", "simulate_satellite_position",
]
