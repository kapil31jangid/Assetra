"""Add the editable customer phone profile field."""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260718_0003"
down_revision: str | Sequence[str] | None = "20260718_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(32)))


def downgrade() -> None:
    op.drop_column("users", "phone")
