import { query } from '@/lib/db';
import { success, error } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inventory';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let data = [];
    let summary = {};

    switch (type) {
      case 'inventory': {
        data = await query(`
          SELECT i.item_code, i.name, c.name as category, i.quantity, i.unit,
                 i.min_stock_level, i.status, i.location, i.purchase_price,
                 s.name as supplier, i.created_at
          FROM inventory_items i
          LEFT JOIN categories c ON c.id = i.category_id
          LEFT JOIN suppliers s ON s.id = i.supplier_id
          ORDER BY i.name ASC
        `);
        summary = {
          totalItems: data.length,
          totalQty: data.reduce((acc, i) => acc + (parseInt(i.quantity) || 0), 0),
          totalValuation: data.reduce((acc, i) => acc + ((parseFloat(i.purchase_price) || 0) * (parseInt(i.quantity) || 0)), 0).toFixed(2),
        };
        break;
      }

      case 'stock-in': {
        const conds = [];
        const params = [];
        if (startDate) { conds.push('si.received_date >= ?'); params.push(startDate); }
        if (endDate) { conds.push('si.received_date <= ?'); params.push(endDate); }
        const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';

        data = await query(`
          SELECT si.received_date, i.item_code, i.name as item_name, si.quantity, i.unit,
                 s.name as supplier, si.reference_no, u.full_name as receiver
          FROM stock_in si
          JOIN inventory_items i ON i.id = si.item_id
          LEFT JOIN suppliers s ON s.id = si.supplier_id
          LEFT JOIN users u ON u.id = si.received_by
          ${where}
          ORDER BY si.received_date DESC
        `, params);
        summary = {
          totalTransactions: data.length,
          totalQuantityReceived: data.reduce((acc, r) => acc + (parseInt(r.quantity) || 0), 0),
        };
        break;
      }

      case 'stock-out': {
        const conds = [];
        const params = [];
        if (startDate) { conds.push('so.out_date >= ?'); params.push(startDate); }
        if (endDate) { conds.push('so.out_date <= ?'); params.push(endDate); }
        const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';

        data = await query(`
          SELECT so.out_date, i.item_code, i.name as item_name, so.quantity, i.unit,
                 so.reason, so.department, so.recipient, u.full_name as recorded_by
          FROM stock_out so
          JOIN inventory_items i ON i.id = so.item_id
          LEFT JOIN users u ON u.id = so.recorded_by
          ${where}
          ORDER BY so.out_date DESC
        `, params);
        summary = {
          totalDispatches: data.length,
          totalQuantityDispatched: data.reduce((acc, r) => acc + (parseInt(r.quantity) || 0), 0),
        };
        break;
      }

      case 'low-stock': {
        data = await query(`
          SELECT i.item_code, i.name, c.name as category, i.quantity, i.unit,
                 i.min_stock_level, i.status, i.location, s.name as supplier
          FROM inventory_items i
          LEFT JOIN categories c ON c.id = i.category_id
          LEFT JOIN suppliers s ON s.id = i.supplier_id
          WHERE i.quantity <= i.min_stock_level
          ORDER BY i.quantity ASC
        `);
        summary = {
          lowStockCount: data.filter(i => i.quantity > 0).length,
          outOfStockCount: data.filter(i => i.quantity === 0).length,
        };
        break;
      }

      case 'borrows': {
        data = await query(`
          SELECT b.borrower_name, b.borrower_department, i.item_code, i.name as equipment_name,
                 b.borrow_date, b.expected_return_date, b.actual_return_date, b.status,
                 b.condition_on_return
          FROM borrows b
          JOIN inventory_items i ON i.id = b.item_id
          ORDER BY b.borrow_date DESC
        `);
        summary = {
          activeBorrows: data.filter(b => b.status === 'borrowed').length,
          overdueBorrows: data.filter(b => b.status === 'overdue').length,
          returnedCount: data.filter(b => b.status === 'returned').length,
        };
        break;
      }

      case 'sme-products': {
        data = await query(`
          SELECT sme_name, product_name, category, quantity, unit,
                 mfg_date, expiry_date, received_date, sample_location, status, description
          FROM sme_products
          ORDER BY sme_name ASC, product_name ASC
        `);
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);

        summary = {
          totalSmeProducts: data.length,
          activeSamples: data.filter(p => p.status === 'active').length,
          expiredCount: data.filter(p => p.status === 'expired' || (p.expiry_date && new Date(p.expiry_date) < now)).length,
          expiringSoonCount: data.filter(p => {
            if (p.status === 'expired') return false;
            if (!p.expiry_date) return false;
            const exp = new Date(p.expiry_date);
            return exp >= now && exp <= in30Days;
          }).length,
        };
        break;
      }

      default:
        break;
    }

    return success({ type, summary, data });
  } catch (err) {
    return error('Failed to generate report: ' + err.message);
  }
}

