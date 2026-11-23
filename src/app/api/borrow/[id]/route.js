import { query, queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound, badRequest } from '@/lib/api-helpers';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const record = await queryOne(`
      SELECT b.*, i.name as item_name
      FROM borrows b
      JOIN inventory_items i ON i.id = b.item_id
      WHERE b.id = ?
    `, [id]);

    if (!record) return notFound('Borrow record not found');

    // Handle return action
    if (body.action === 'return') {
      const actual_return_date = body.actual_return_date || new Date().toISOString().split('T')[0];
      const condition_on_return = body.condition_on_return || 'Normal / Functional';
      
      await update('borrows', {
        status: 'returned',
        actual_return_date,
        condition_on_return,
        notes: body.notes ? `${record.notes ? record.notes + ' | ' : ''}Return note: ${body.notes}` : record.notes
      }, 'id = ?', [id]);

      await logActivity(1, 'returned', 'equipment', record.item_id, record.item_name, `Returned by ${record.borrower_name}`);

      return success({ message: 'Equipment returned successfully' });
    }

    // General update
    const updated = {
      borrower_name: body.borrower_name || record.borrower_name,
      borrower_department: body.borrower_department !== undefined ? body.borrower_department : record.borrower_department,
      borrower_contact: body.borrower_contact !== undefined ? body.borrower_contact : record.borrower_contact,
      expected_return_date: body.expected_return_date || record.expected_return_date,
      status: body.status || record.status,
      notes: body.notes !== undefined ? body.notes : record.notes,
    };

    await update('borrows', updated, 'id = ?', [id]);
    return success({ id, ...updated });
  } catch (err) {
    return error('Failed to update borrow record: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const record = await queryOne('SELECT * FROM borrows WHERE id = ?', [id]);
    if (!record) return notFound('Borrow record not found');

    await remove('borrows', 'id = ?', [id]);
    return success({ message: 'Borrow record deleted' });
  } catch (err) {
    return error('Failed to delete borrow record: ' + err.message);
  }
}

