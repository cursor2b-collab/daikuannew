import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const userId = searchParams.get('userId')

    if (!phone && !userId) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 })
    }

    let query = supabase.from('users').select('*')
    if (userId) {
      query = query.eq('id', parseInt(userId))
    } else if (phone) {
      const trimmed = phone.trim()
      // 先精确匹配
      query = query.eq('phone', trimmed)
    }

    let result = await query
    if (result.error) throw result.error
    let list = result.data || []
    if (list.length === 0 && phone) {
      const digitsOnly = (phone || '').replace(/\D/g, '')
      if (digitsOnly.length >= 11) {
        const last11 = digitsOnly.slice(-11)
        const { data: list2 } = await supabase.from('users').select('*').ilike('phone', `%${last11}%`)
        if (list2?.length) list = list2
      }
    }
    const user = list[0]
    if (!user) {
      return NextResponse.json({ code: 404, msg: '用户不存在' }, { status: 404 })
    }

    const amount = parseFloat(user.amount?.toString() || '0')
    const overdueDays = user.overdue_days || 0
    const annualRate = parseFloat(user.annual_rate?.toString() || '10.88')
    const dailyPenalty = parseFloat(user.daily_penalty?.toString() || '2.50')
    const rawMonths = (user as any).repayment_months ?? (user as any).repaymentMonths
    const repaymentMonths = (rawMonths !== null && rawMonths !== undefined && rawMonths !== '')
      ? Math.max(0, parseInt(String(rawMonths).trim(), 10) || 0)
      : 0
    const isSettled = user.is_settled || false
    const isInterestFree = !!user.is_interest_free

    // 是否启用分期
    const hasInstallment = repaymentMonths > 0

    let loanData: any

    if (hasInstallment) {
      // 分期计算（免息用户利息为 0）
      const monthlyPrincipal = amount / repaymentMonths
      const monthlyInterestAmount = isInterestFree ? 0 : (amount * annualRate / 100) / 12
      const monthlyTotal = monthlyPrincipal + monthlyInterestAmount
      const totalInterest = monthlyInterestAmount * repaymentMonths
      const totalPenalty = dailyPenalty * overdueDays
      const totalRepayment = amount + totalInterest + totalPenalty

      // 生成还款计划
      const today = new Date()
      const loanDate = user.loan_date ? new Date(user.loan_date) : new Date()

      const schedule = Array.from({ length: repaymentMonths }, (_, i) => {
        const periodNum = i + 1
        const dueDate = new Date(loanDate)
        dueDate.setMonth(dueDate.getMonth() + periodNum)

        let status: 'overdue' | 'current' | 'pending' | 'paid'
        if (isSettled) {
          status = 'paid'
        } else if (dueDate < today) {
          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
          status = diffDays > 0 ? 'overdue' : 'current'
        } else {
          const prevDue = new Date(loanDate)
          prevDue.setMonth(prevDue.getMonth() + i)
          status = prevDue <= today && today <= dueDate ? 'current' : 'pending'
        }

        return {
          period: periodNum,
          principal: parseFloat(monthlyPrincipal.toFixed(2)),
          interest: parseFloat(monthlyInterestAmount.toFixed(2)),
          total: parseFloat(monthlyTotal.toFixed(2)),
          dueDate: dueDate.toISOString().replace('T', ' ').slice(0, 19),
          status,
        }
      })

      loanData = {
        user_id: user.id,
        name: user.name || '用户',
        phone: user.phone || '',
        id_number: user.id_number || '',
        loan_number: user.loan_number || '',
        bank_card: user.bank_card || '',
        is_settled: isSettled,
        is_interest_free: user.is_interest_free || false,
        payment_method: user.payment_method || [],

        // 分期模式字段
        hasInstallment: true,
        amount,
        loanAmount: amount.toFixed(2),
        annualRate: isInterestFree ? 0 : annualRate,
        loanDate: user.loan_date ? new Date(user.loan_date).toISOString().replace('T', ' ').slice(0, 19) : '',
        repaymentMonths,
        monthlyPrincipal: monthlyPrincipal.toFixed(2),
        monthlyInterest: monthlyInterestAmount.toFixed(2),
        monthlyTotal: monthlyTotal.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        overdueDays,
        dailyPenalty,
        totalPenalty: totalPenalty.toFixed(2),
        totalRepayment: totalRepayment.toFixed(2),
        schedule,
      }
    } else {
      // 非分期模式（免息用户不计算利息）
      const overdueAmount = parseFloat(user.overdue_amount?.toString() || '0')
      const amountDue = parseFloat(user.amount_due?.toString() || '0')
      const totalInterest = isInterestFree ? 0 : (overdueAmount > 0 ? overdueAmount * 0.1 : amount * 0.1)
      const totalRepayment = isInterestFree ? amountDue : amountDue + totalInterest

      let dueDate = '2024-12-01'
      if (user.loan_date) {
        const ld = new Date(user.loan_date)
        ld.setDate(ld.getDate() + 150)
        dueDate = ld.toISOString().split('T')[0]
      }

      const status = overdueDays > 0 || overdueAmount > 0 ? '已逾期' : isSettled ? '已结清' : '正常'

      loanData = {
        user_id: user.id,
        name: user.name || '用户',
        phone: user.phone || '',
        id_number: user.id_number || '',
        loan_number: user.loan_number || '',
        bank_card: user.bank_card || '',
        is_settled: isSettled,
        is_interest_free: user.is_interest_free || false,
        payment_method: user.payment_method || [],

        hasInstallment: false,
        loanAmount: amount.toFixed(2),
        paidAmount: '0.00',
        interestRate: `${annualRate}%`,
        loanDate: user.loan_date || '',
        cycle: '随借随还',
        dueDate,
        totalInterest: totalInterest.toFixed(2),
        status,
        overdueAmount: overdueAmount.toFixed(2),
        overdueDays,
        totalRepayment: totalRepayment.toFixed(2),
      }
    }

    return NextResponse.json(
      { code: 200, msg: '获取成功', data: loanData },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' } }
    )
  } catch (error: any) {
    console.error('Get user data error:', error)
    return NextResponse.json({ code: 500, msg: error.message || '获取用户数据失败' }, { status: 500 })
  }
}
