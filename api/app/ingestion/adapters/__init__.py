from app.ingestion.adapters.dst_adapter import DSTAdapter
from app.ingestion.adapters.indiagov_adapter import IndiaGovAdapter
from app.ingestion.adapters.isro_adapter import ISROAdapter
from app.ingestion.adapters.moefcc_adapter import MoEFCCAdapter
from app.ingestion.adapters.niti_adapter import NITIAdapter
from app.ingestion.adapters.pib_adapter import PIBAdapter
from app.ingestion.adapters.rbi_adapter import RBIAdapter
from app.ingestion.adapters.upsc_adapter import UPSCAdapter

__all__ = [
    "PIBAdapter",
    "UPSCAdapter",
    "RBIAdapter",
    "NITIAdapter",
    "MoEFCCAdapter",
    "DSTAdapter",
    "ISROAdapter",
    "IndiaGovAdapter",
]
