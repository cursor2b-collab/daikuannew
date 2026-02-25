import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const userId = searchParams.get('userId')

    if (!phone && !userId) {
      return NextResponse.json(
        { code: 400, msg: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 构建查询
    let query = supabase.from('users').select('*')

    if (userId) {
      query = query.eq('id', parseInt(userId))
    } else if (phone) {
      query = query.eq('phone', phone.trim())
    }

    const { data: users, error } = await query

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { code: 404, msg: '用户不存在' },
        { status: 404 }
      )
    }

    const user = users[0]

    // 计算还款相关数据
    const amount = parseFloat(user.amount?.toString() || '0')
    const overdueAmount = parseFloat(user.overdue_amount?.toString() || '0')
    const amountDue = parseFloat(user.amount_due?.toString() || '0')
    const overdueDays = user.overdue_days || 0

    // 计算总利息（假设为逾期金额的一部分，或根据业务逻辑计算）
    const totalInterest = overdueAmount > 0 ? overdueAmount * 0.1 : amount * 0.1

    // 计算总还款金额
    const totalRepayment = amountDue + totalInterest

    // 计算到期日期（放款时间 + 150天，或根据业务逻辑）
    let dueDate = '2024-12-01'
    if (user.loan_date) {
      const loanDate = new Date(user.loan_date)
      loanDate.setDate(loanDate.getDate() + 150) // 假设150天周期
      dueDate = loanDate.toISOString().split('T')[0]
    }

    // 判断状态
    const isOverdue = overdueDays > 0 || overdueAmount > 0
    const status = isOverdue ? '已逾期' : user.is_settled ? '已结清' : '正常'

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        // 用户基本信息
        user_id: user.id,
        name: user.name || '用户',
        phone: user.phone || '',
        id_number: user.id_number || '',
        loan_number: user.loan_number || '',
        bank_card: user.bank_card || '',
        
        // 还款数据
        loanAmount: amount.toFixed(2),
        paidAmount: '0.00', // 已还金额，可以根据实际业务逻辑计算
        interestRate: '10.88%', // 年化利率，可以从系统设置获取
        loanDate: user.loan_date || '',
        cycle: '随借随还',
        dueDate: dueDate,
        totalInterest: totalInterest.toFixed(2),
        status: status,
        overdueAmount: overdueAmount.toFixed(2),
        overdueDays: overdueDays,
        totalRepayment: totalRepayment.toFixed(2),
        is_settled: user.is_settled || false,
        is_interest_free: user.is_interest_free || false,
        
        // 收款方式
        payment_method: user.payment_method || []
      }
    })
  } catch (error: any) {
    console.error('Get user data error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取用户数据失败' },
      { status: 500 }
    )
  }
}
