import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const COPY_KEYS_INDEX = [
  'copy_site_name',
  'copy_index_page_title',
  'copy_index_subtitle',
  'copy_hero_product_name',
  'copy_hero_quota_label',
  'copy_hero_amount',
  'copy_hero_rate',
  'copy_hero_tip',
  'copy_marquee_messages',
  'copy_product_title',
  'copy_rate_info',
  'copy_max_amount',
  'copy_payment_method',
  'copy_process_method',
  'copy_step1_text',
  'copy_step2_text',
  'copy_step3_text',
] as const

async function getCopySettings(): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['site_name', ...COPY_KEYS_INDEX])
  const map: Record<string, string> = {}
  if (data) {
    for (const row of data) {
      const v = row.setting_value
      if (v !== undefined && v !== null) map[row.setting_key] = String(v)
    }
  }
  return map
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || 'index'
  const phone = searchParams.get('phone') || ''

  const defaults: Record<string, any> = {
    index: {
      title: '金融服务平台',
      page_title: '分期付',
      subtitle: '超快下款 超低利率',
      welcome_text: '欢迎使用我们的服务',
      amount_label: '最高可获额度(元)',
      amount_value: '200,000',
      rate_label: '年化利率',
      login_btn_text: '立即登录',
      tip_text: '理性借贷 合理消费',
      step1_text: '3分钟申请额度',
      step2_text: '30秒最快审批',
      step3_text: '1分钟最快放款',
      product_title: '产品详情',
      rate_info: '年化费率（单利）7.2%~34%',
      max_amount: '最高可申请200,000元',
      payment_method: '等额本息、等额本金、本息同还',
      process_method: '快1分钟，详情至本人银行卡',
      cooperation_title: '合作机构',
      hero_product_name: '分期付',
      hero_quota_label: '最高可获额度（元）',
      hero_amount: '200,000',
      hero_rate: '年化利率（单利）7.2%起',
      hero_tip: '理性借贷 合理消费',
      marquee_messages: [
        '07-07 用户尾号4826 成功申请服务 78800元',
        '07-07 用户尾号1234 成功申请服务 50000元',
        '07-07 用户尾号5678 成功申请服务 30000元',
      ],
    },
    login: {
      code_placeholder: '请输入验证码',
      get_code_btn: '获取验证码',
      login_auth_type: '1',
    },
    user: {
      welcome_text: '分期付 欢迎您',
      subtitle: '超快下款 超低利率',
      amount_label: '欠款金额',
      amount_value: '0元',
      user_name: phone === '15263182283' ? '谭晓敏' : phone === '13879816846' ? '谭晓敏' : '用户',
      menu1_text: '申请服务',
      menu2_text: '我的服务',
      menu3_text: '我的欠款',
      menu4_text: '在线客服',
      menu5_text: '我的资料',
      menu6_text: '个人中心',
      impact_title: '逾期影响',
      penalty_text: '延迟费用/延迟费',
      credit_text: '上报征信',
      legal_text: '出行受限',
      cooperation_title: '合作机构',
    },
    repayment: {
      welcome_text: '分期付 欢迎您',
      amount_label: '借款金额',
      amount: '6000元',
      paid_amount: '0.00元',
      rate_label: '年化利率',
      interest_rate: '10.88%',
      process_time_label: '放款时间',
      loan_date: '2024-07-28',
      cycle_label: '周期',
      due_date_label: '到期日期',
      due_date: '2024-12-01',
      total_fee_label: '总利息',
      total_interest: '652.80',
      status_label: '借款状态',
      penalty_label: '逾期金额',
      amount_end_amount: '1200.00',
      amount_end_day: '30',
      total_amount_label: '总还款金额',
      total_amount: '7852.80',
      contract_btn_text: '贷款合同',
      upload_title: '上传凭证图片',
      select_btn_text: '选择图片并自动上传',
      repayment_periods: '全额还款',
      repayment_months: '0',
      is_repaid: '0',
      is_free_interest: '0',
      loan_no: 'DHT2024110100-4374-024',
    },
    contract: {
      contract_title: '借款合同',
      lender_name: '分期付企业管理有限公司云南分公司',
      borrower_name: '张三',
      company_license: '530100500447129',
      id_card_value: '110101199001011234',
      company_address: '云南省昆明市',
      service_amount_value: '6000元',
      establish_date: '2020-01-01',
      legal_rep: '李君龙',
      bank_card_value: '6222****1234',
      contract_no: 'XA-56PR36647',
      phone_value: phone || '138****8888',
      service_amount_value_2: '6000元',
      company_seal_name: '分期付企业管理有限公司云南分公司',
      date_text: new Date().toLocaleDateString('zh-CN'),
    },
  }

  let data = defaults[page] || defaults.index

  if (page === 'index') {
    try {
      const copy = await getCopySettings()
      if (copy.copy_index_page_title !== undefined && copy.copy_index_page_title !== null) {
        data = { ...data, page_title: String(copy.copy_index_page_title), title: String(copy.copy_index_page_title) }
      }
      if (copy.copy_index_subtitle !== undefined && copy.copy_index_subtitle !== null) data = { ...data, subtitle: String(copy.copy_index_subtitle) }
      if (copy.copy_hero_product_name !== undefined && copy.copy_hero_product_name !== null) data = { ...data, hero_product_name: String(copy.copy_hero_product_name) }
      if (copy.copy_hero_quota_label !== undefined && copy.copy_hero_quota_label !== null) data = { ...data, hero_quota_label: String(copy.copy_hero_quota_label) }
      if (copy.copy_hero_amount !== undefined && copy.copy_hero_amount !== null) data = { ...data, hero_amount: String(copy.copy_hero_amount) }
      if (copy.copy_hero_rate !== undefined && copy.copy_hero_rate !== null) data = { ...data, hero_rate: String(copy.copy_hero_rate) }
      if (copy.copy_hero_tip !== undefined && copy.copy_hero_tip !== null) data = { ...data, hero_tip: String(copy.copy_hero_tip) }
      if (copy.copy_product_title !== undefined && copy.copy_product_title !== null) data = { ...data, product_title: String(copy.copy_product_title) }
      if (copy.copy_rate_info !== undefined && copy.copy_rate_info !== null) data = { ...data, rate_info: String(copy.copy_rate_info) }
      if (copy.copy_max_amount !== undefined && copy.copy_max_amount !== null) data = { ...data, max_amount: String(copy.copy_max_amount) }
      if (copy.copy_payment_method !== undefined && copy.copy_payment_method !== null) data = { ...data, payment_method: String(copy.copy_payment_method) }
      if (copy.copy_process_method !== undefined && copy.copy_process_method !== null) data = { ...data, process_method: String(copy.copy_process_method) }
      if (copy.copy_step1_text !== undefined && copy.copy_step1_text !== null) data = { ...data, step1_text: String(copy.copy_step1_text) }
      if (copy.copy_step2_text !== undefined && copy.copy_step2_text !== null) data = { ...data, step2_text: String(copy.copy_step2_text) }
      if (copy.copy_step3_text !== undefined && copy.copy_step3_text !== null) data = { ...data, step3_text: String(copy.copy_step3_text) }
      if (copy.copy_marquee_messages !== undefined && copy.copy_marquee_messages !== null) {
        try {
          const arr = JSON.parse(String(copy.copy_marquee_messages))
          if (Array.isArray(arr)) data = { ...data, marquee_messages: arr }
        } catch (_) {}
      }
    } catch (e) {
      console.error('[getData] index copy merge error:', e)
    }
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  })
}
