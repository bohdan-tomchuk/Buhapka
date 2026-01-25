import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from 'typeorm';

export class CreateReceiptAndAddToExpense1737829200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create receipts table
    await queryRunner.createTable(
      new Table({
        name: 'receipts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'file_path',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add receipt_id column to expenses table
    await queryRunner.addColumn(
      'expenses',
      new TableColumn({
        name: 'receipt_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'expenses',
      new TableForeignKey({
        columnNames: ['receipt_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'receipts',
        onDelete: 'SET NULL',
      }),
    );

    // Create index on receipt_id for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_expenses_receipt_id" ON "expenses" ("receipt_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_expenses_receipt_id"`);

    // Drop foreign key
    const table = await queryRunner.getTable('expenses');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('receipt_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('expenses', foreignKey);
    }

    // Drop receipt_id column
    await queryRunner.dropColumn('expenses', 'receipt_id');

    // Drop receipts table
    await queryRunner.dropTable('receipts');
  }
}
