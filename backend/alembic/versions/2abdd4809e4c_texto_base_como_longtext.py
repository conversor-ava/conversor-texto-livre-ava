"""texto_base como longtext

Revision ID: 2abdd4809e4c
Revises: f983ddb25e1d
Create Date: 2026-11-02 05:36:17.682508

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

TEXTO_LONGO = sa.Text().with_variant(mysql.LONGTEXT(), "mysql")

# revision identifiers, used by Alembic.
revision: str = '2abdd4809e4c'
down_revision: Union[str, Sequence[str], None] = 'f983ddb25e1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("geracoes") as batch_op:
        batch_op.alter_column(
            "texto_base",
            existing_type=sa.Text(),
            type_=TEXTO_LONGO,
            existing_nullable=False,
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Atenção: falha se existir texto_base com mais de 64 KB (o MySQL em modo
    # estrito recusa em vez de truncar).
    with op.batch_alter_table("geracoes") as batch_op:
        batch_op.alter_column(
            "texto_base",
            existing_type=TEXTO_LONGO,
            type_=sa.Text(),
            existing_nullable=False,
        )
    # ### end Alembic commands ###
