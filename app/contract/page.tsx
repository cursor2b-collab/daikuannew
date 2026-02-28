'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, syncLoginWithServer, loadPageData } from '@/lib/api'

export default function ContractPage() {
  const router = useRouter()
  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initPage = async () => {
      // 检查URL参数（从管理后台打开时）
      const params = new URLSearchParams(window.location.search)
      const userId = params.get('userId')
      const name = params.get('name')
      const phone = params.get('phone')
      const idNumber = params.get('idNumber')
      const loanNumber = params.get('loanNumber')
      const bankCard = params.get('bankCard')
      const amount = params.get('amount')

      // 如果是从管理后台打开，直接使用URL参数
      if (userId && name && phone) {
        const contractData = {
          contract_title: '借款合同',
          lender_name: '分期付企业管理有限公司云南分公司',
          borrower_name: decodeURIComponent(name),
          company_license: '530100500447129',
          id_card_value: decodeURIComponent(idNumber || ''),
          company_address: '云南省昆明市',
          service_amount_value: amount ? `${parseFloat(amount).toFixed(2)}元` : '0元',
          establish_date: '2020-01-01',
          legal_rep: '李君龙',
          bank_card_value: decodeURIComponent(bankCard || ''),
          contract_no: decodeURIComponent(loanNumber || 'XA-56PR36647'),
          phone_value: decodeURIComponent(phone),
          service_amount_value_2: amount ? `${parseFloat(amount).toFixed(2)}元` : '0元',
          company_seal_name: '分期付企业管理有限公司云南分公司',
          date_text: new Date().toLocaleDateString('zh-CN'),
        }
        setPageData(contractData)
        setLoading(false)
        return
      }

      // 检查登录状态（普通用户访问）
      const userInfo = getCurrentUser()
      if (!userInfo || !userInfo.phone) {
        try {
          const loggedIn = await syncLoginWithServer(false)
          if (!loggedIn) {
            router.push('/login')
            return
          }
        } catch (error) {
          router.push('/login')
          return
        }
      }

      // 加载合同数据
      try {
        const user = getCurrentUser()
        const phone = user?.phone || ''
        const data = await loadPageData('contract', phone)
        setPageData(data)
      } catch (error) {
        console.error('加载数据失败:', error)
        // 使用默认数据
        setPageData(getDefaultData())
      } finally {
        setLoading(false)
      }
    }

    initPage()
  }, [router])

  const getDefaultData = () => ({
    contract_title: '借款合同',
    lender_name: '分期付企业管理有限公司云南分公司',
    borrower_name: '加载中...',
    company_license: '530100500447129',
    id_card_value: '加载中...',
    company_address: '云南省昆明市',
    service_amount_value: '加载中...',
    establish_date: '2020-01-01',
    legal_rep: '李君龙',
    bank_card_value: '加载中...',
    contract_no: 'XA-56PR36647',
    phone_value: '加载中...',
    service_amount_value_2: '加载中...',
    company_seal_name: '分期付企业管理有限公司云南分公司',
    date_text: new Date().toLocaleDateString('zh-CN'),
  })

  const downloadContract = () => {
    const head = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
                 '<head><meta charset="utf-8"><title>借款合同</title></head><body>'
    const body = document.documentElement.outerHTML
    const tail = '</body></html>'
    const html = head + body + tail

    const filename = '借款合同_' + new Date().toISOString().slice(0, 10) + '.doc'
    const dataUrl = 'data:application/msword;charset=utf-8,' + encodeURIComponent(html)

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  useEffect(() => {
    document.body.classList.add('contract-page')
    return () => {
      document.body.classList.remove('contract-page')
    }
  }, [])

  if (loading || !pageData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    )
  }

  const displayData = pageData || getDefaultData()

  return (
    <div>
      <div className="contract-nav">
        <button className="back-btn" onClick={() => router.back()} type="button">
          返回
        </button>
        <span className="contract-title" id="contract_title_display">
          {displayData.contract_title || '借款合同'}
        </span>
      </div>

      <div className="contract-container">
        <h2 id="contract_title">{displayData.contract_title || '借款合同'}</h2>

        <table className="contract-table">
          <tbody>
            <tr>
              <td>放款方</td>
              <td id="lender_name">{displayData.lender_name || '加载中...'}</td>
              <td>借款方</td>
              <td id="borrower_name">{displayData.borrower_name || '加载中...'}</td>
            </tr>
            <tr>
              <td>营业执照</td>
              <td id="company_license">{displayData.company_license || '加载中...'}</td>
              <td>身份证号</td>
              <td id="id_card_value">{displayData.id_card_value || '加载中...'}</td>
            </tr>
            <tr>
              <td>公司地址</td>
              <td id="company_address">{displayData.company_address || '加载中...'}</td>
              <td>时间和金额</td>
              <td id="service_amount_value">{displayData.service_amount_value || '加载中...'}</td>
            </tr>
            <tr>
              <td>成立日期</td>
              <td id="establish_date">{displayData.establish_date || '加载中...'}</td>
              <td>收款方式</td>
              <td>银联账户</td>
            </tr>
            <tr>
              <td>法人代表</td>
              <td id="legal_rep">{displayData.legal_rep || '加载中...'}</td>
              <td>银行卡号</td>
              <td id="bank_card_value">{displayData.bank_card_value || '加载中...'}</td>
            </tr>
            <tr>
              <td>合同编号</td>
              <td id="contract_no">{displayData.contract_no || '加载中...'}</td>
              <td>手机号码</td>
              <td id="phone_value">{displayData.phone_value || '加载中...'}</td>
            </tr>
          </tbody>
        </table>

        <div className="contract-section">
          根据《中华人民共和国合同法》的相关规定，经放款方、借款方协商一致，签订本合同并共同承诺履行本合同所定义之具有法律效力的。
        </div>

        <div className="contract-section">
          <strong>第一条：</strong>贷款种类：无抵押担保贷款
        </div>
        <div className="contract-section">
          <strong>第二条：</strong>借款金额：<span id="service_amount_value_2">{displayData.service_amount_value_2 || '加载中...'}</span>
        </div>
        <div className="contract-section">
          <strong>2.</strong>签订合同后，借贷双方必须共同遵守中华人民共和国合同法第一百九十六条。
        </div>
        <div className="contract-section">
          <strong>第三条：</strong>借款用途：资金周转
        </div>
        <div className="contract-section">
          <strong>第四条：</strong>利率：月利息0.6%，先息后本，固定利息。
        </div>
        <div className="contract-section">
          <strong>第五条：</strong>贷款实际发放和期限以借据记载为依据和回单。借据应作为合同附件，本合同具有同等法律效力。
        </div>
        <div className="contract-section">
          <strong>第六条：</strong>还款金额数及还款方式：
        </div>
        <div className="contract-section">
          1. 还款金额总额：月工资收入6000元
        </div>
        <div className="contract-section">
          2. 还款金额方式：本金到期归还，贷款滞三个月后可提前还款！
        </div>
        <div className="contract-section">
          3. 利息本金还款方式：到期支付
        </div>
        <div className="contract-section">
          <strong>第七条：</strong>保证条款：本公司与金融机构平台会放款后，借款方须知：1按时支付利息，2到期按时还本金，3必须履行合同所有条款。
        </div>
        <div className="contract-section">
          <strong>第八条：</strong>违约责任：
        </div>
        <div className="contract-section">
          1. 如借款方未履行合同条款，须支付贷款金额的50%作为违约赔偿。
        </div>
        <div className="contract-section">
          2. 放款方可代为向借款方账户直接划扣本息。
        </div>
        <div className="contract-section">
          3. 借款方应提前5日申请续借，否则到期须如数还款。
        </div>
        <div className="contract-section">
          <strong>第九条：借款人的权利与义务</strong>
        </div>
        <div className="contract-section">
          1. 借款方保证按规定用途使用借款，若违约使用，放款方有权加收罚息。
        </div>
        <div className="contract-section">
          2. 借款方如需延期还款，应在到期前5天申请，经放款方审查同意。
        </div>
        <div className="contract-section">
          3. 借款方须无不良信用记录，银行账户本人使用，有良好信誉。
        </div>
        <div className="contract-section">
          4. 借款方需保证账户中有 30%~50% 贷款额度资金用于银联验证最低还款能力。
        </div>
        <div className="contract-section">
          <strong>第十条：</strong>合同变更或解除：
        </div>
        <div className="contract-section">
          除《合同法》规定允许变更或解除合同的情况外，任何一方不得擅自变更或解除合同。应书面通知，并仍需偿还借款和利息。
        </div>
        <div className="contract-section">
          <strong>第十一条：</strong>解决合同纠纷的方式：
        </div>
        <div className="contract-section">
          发生争议由双方协商，协商不成直接向人民法院起诉。我司注册号: 530100500447129
        </div>
        <div className="contract-section">
          <strong>第十二条：</strong>协商免利息还款方式由出资方分期付为您下发（微信 支付宝 银行卡转账）协商还款需要本人进行手动归还资金。
        </div>

        <div className="contract-section">
          <strong>5.6 还款顺序：</strong>实现债权的费用(如有)、逾期违约金(如有)、逾期利息(如有)、逾期本金(如有)、提前还款违约金(如有)、当期利息、当期本金、下期本金，贷款人有权根据您的信用状况和贷款人的风险政策变更前述扣款顺序。特别的，当您选择等额本息或先息后本方式时，您的还款顺序以前端页面显示和具体的还款计划为准。
        </div>
        <div className="contract-section">
          <strong>5.7</strong> 如贷款人为两人时，贷款人之间按贷款资金比例份额共同享有对您的债权，任一方均有权向您要求归还本合同项下全部贷款本息，您不得以此为由拒绝偿还贷款或只偿还部分贷款人的款项。
        </div>
        <div className="contract-section">
          <strong>6. 提前还款</strong>
        </div>
        <div className="contract-section">
          借款期限届满前，在征得贷款人同意的前提下，您可主动提前归还全部或部分本合同项下的应还款项。贷款人届时可能会向您收取提前还款违约金、并要求您退还已减免的全额或部分利息(如有)，根据计息方式和还款方式收取规则具体如下:
        </div>
        <div className="contract-section">
          (1) 按月还款，按月计息:除第一期外，每月偿还固定金额贷款本息，用户须按照选定的还款计划在到期付款日前支付全部到期应付款项。
        </div>
        <div className="contract-section">
          (2) 等额本金还款，按日计息:除第一期外，每月偿还固定金额贷款本金，并偿付当月实际占用资金天数而产生的利息，贷款到期日归还剩余贷款本金及利息。
        </div>
        <div className="contract-section">
          (3) 等额本息还款，按日计息:每月偿还固定金额贷款本息，每期利息按当月实际占用资金天数计算，贷款到期日归还剩余贷款本金及利息。
        </div>
        <div className="contract-section">
          (4) 先息后本还款，按日计息:每月偿还当月实际占用资金天数而产生的利息，贷款到期日归还全部贷款本金及剩余利息。
        </div>
        <div className="contract-section">
          (5) 随借随还，本息同还，按日计息:实际占用资金天数而产生的利息，贷款到期日归还全部贷款本金及利息。
        </div>
        <div className="contract-section">
          <strong>7. 合同变更、解除、权利义务的转让</strong>
        </div>
        <div className="contract-section">
          7.1 合同变更与解除
        </div>
        <div className="contract-section">
          (1) 贷款人可在法律允许的范围内对本合同的内容进行修订，但相关修改不会加重您在贷款金额和利率方面的责任。一旦合同条款变更，贷款人将按照本合同约定的通知方式通知您，除法律法规另有强制性规定外，经修订的内容生效时间以通知载明日期为准。您可自行选择是否继续使用贷款人提供的服务，一旦您在修订生效后继续使用本贷款服务即被视为您已接受了修改后的合同内容;如不同意有关变更，可全额还清本合同项下所有应付款项后，停止使用贷款人提供的贷款服务。
        </div>
        <div className="contract-section">
          (2) 本合同生效后，除本合同另有约定外，您不得要求单方擅自变更或解除本合同。如贷款人基于自身经营原因或基于对您信用资质的判断导致无法为您继续提供服务，贷款人有权在不违反相关法律法规的前提下宣布中断、终止本合同或其任何部分(包括但不限于停止发放贷款等)，并要求您在指定期限内偿还本合同项下应付款项。
        </div>
        <div className="contract-section">
          7.2 合同权利义务的转让
        </div>
        <div className="contract-section">
          (1) 未经贷款人书面同意，您不得将本合同项下的权利和义务转让给任何第三方。贷款人有权将其在本合同项下的权利和义务全部或部分转让给第三方，且债权转让行为无须整征得您的同意。合同权利义务转让后，您理解并同意，您与债权受让人之间的权利义务仍适用于本合同的约定。
        </div>
        <div className="contract-section">
          (2) 为保证本借款合同的履行，贷款人有权委托汇正(厦门)融资担保有限公司、花花安联财产保险有限公司或其他第三方为本次贷款向贷款人提供信用保险或其他保证。若该等第三方为贷款人承担了保险责任或保证责任，第三方有权按照本合同的约定足额向您追偿或者转让其追偿权并由债权受让人向您追偿。
        </div>
        <div className="contract-section">
          <strong>8. 声明与承诺</strong>
        </div>
        <div className="contract-section">
          8.1 您应保证在安全环境下通过各种媒介使用本服务，否则您须对非安全环境在各种媒介上使用本贷款服务所导致的风险和损失自行负责。
        </div>
        <div className="contract-section">
          8.2 您理解本合同所涉贷款服务有赖于服务方及网银在线系统的准确运行及操作。若出现服务方及网银在线系统差错、故障或其他原因引发了展示错误、用户不当获利等情形的，您同意贷款人及网银在线可以自行或通过第三方采取更正差错、扣划款项、暂停服务等适当纠正措施。
        </div>
        <div className="contract-section">
          8.3 您已阅读本合同所有条款且清楚地知悉贷款人的经营范围、授权权限。
        </div>
        <div className="contract-section">
          8.4 签署和履行本合同是您真实的意思表示，您具备签署和履行本合同所有必要的权利能力和行为能力、能以自身名义履行本合同的义务并承担民事责任。
        </div>
        <div className="contract-section">
          8.5 您应妥善保管在服务平台中留存的，包括但不限于服务账户、密码、数字证书、绑定的手机号码、手机验证码等与本合同项下贷款有关的一切信息。在贷款人根据本合同确定的校验方式校验您身份通过后，通过您账户进行的一切活动均代表您本人的意思并由您承担相应的法律后果。您应确保不向其他任何人泄露前述信息。对于因前述信息泄露所导致的损失，由您自行承担。
        </div>
        <div className="contract-section">
          8.6 您承诺您所提供的个人相关的收入、资产证明及其他任何能够证明您信用情况的资料真实、完整、有效。
        </div>
        <div className="contract-section">
          <strong>9. 反洗钱条款</strong>
        </div>
        <div className="contract-section">
          9.1 您应按照法律法规规定及贷款人要求，完整提供各项身份信息资料，配合贷款人开展身份识别工作，保证向贷款人提供的所有身份信息资料均真实、完整、准确、合法、有效。
        </div>
        <div className="contract-section">
          9.2 在业务关系存续期间，您身份资料信息发生变更的，应当及时向贷款人更新其身份资料。如您身份证明文件有效期过期或者即将过期的，您应及时更新其身份证明文件。如您身份证明文件未在证件到期后及时更新且没有提出合理理由的，贷款人有权中止为您办理业务。
        </div>
        <div className="contract-section">
          9.3 当贷款人在日常经营中发现您身份资料信息不准确或者不完整时，您应配合贷款人补充完善其身份资料。
        </div>
        <div className="contract-section">
          9.4 当贷款人在日常经营中发现您存在异常行为、可疑交易或疑似涉嫌洗钱、恐怖融资等情况时，您应配合贷款人做好尽职调查工作。贷款人有权根据反洗钱法律法规等有关规定，结合洗钱风险状况对您采取相应管控措施，甚至拒绝提供金融服务。
        </div>
        <div className="contract-section">
          <strong>10. 违约责任</strong>
        </div>
        <div className="contract-section">
          10.1 下列任一事件均构成本条款所称违约事件:
        </div>
        <div className="contract-section">
          (1) 您违反本合同第3条约定或将资金用于禁止领域或您拒绝、阻碍贷款人对贷款用途进行检查的;
        </div>
        <div className="contract-section">
          (2) 您存在任何一笔本金、利息、其他费用或逾期款项的;
        </div>
        <div className="contract-section">
          (3) 您在履行与贷款人签订的其他合同时有违约行为;
        </div>
        <div className="contract-section">
          (4) 您未履行本合同下任何义务的行为;
        </div>
        <div className="contract-section">
          (5) 您向贷款人提供虚假的信息或隐瞒、遗漏重要信息或向贷款人提供误导性陈述;
        </div>
        <div className="contract-section">
          (6) 您转移资产以逃避债务的;
        </div>
        <div className="contract-section">
          (7) 其他贷款人认为您可能发生严重影响偿债能力的情形。
        </div>
        <div className="contract-section">
          10.2 有违约事件发生时，贷款人有权采取下列一项或多项措施:
        </div>
        <div className="contract-section">
          (1) 停止向您发放贷款;
        </div>
        <div className="contract-section">
          (2) 要求您限期纠正违约行为并赔偿相应的损失;
        </div>
        <div className="contract-section">
          (3) 要求您提前归还已发放的全部贷款本金并结清利息;
        </div>
        <div className="contract-section">
          (4) 根据贷款风险状况调整贷款金额、期限与利率;
        </div>
        <div className="contract-section">
          (5) 取消您贷款时所获得及后续可能获得的优惠政策(如利息减免、利率折扣等);
        </div>
        <div className="contract-section">
          (6) 违约事件发生时，您在本合同项下未偿还的贷款提前到期，您应立即归还所有贷款本金、所有利息、逾期违约金、实现债权的费用等，贷款人可委托您已绑定自动还款的银行卡开户行或第三方支付机构组织从您的银行卡/花花小金库/花花钱包账户、或从您在贷款人处开立的账户中扣除相应金额以收回相关方费用、违约金、利息、本金以及所有其他应付费用;
        </div>
        <div className="contract-section">
          (7) 违约事件发生时，贷款人有权自行或委托第三方(包括但不限于服务方、催收机构、律师事务所或其他合法的第三方机构)通过信函、短信、电子邮件、电话、上门或司法途径等方式向您进行催告提醒。
        </div>
        <div className="contract-section">
          (8) 采取法律、法规规定的其他救济措施。
        </div>
        <div className="contract-section">
          10.3 您任何一期未及时足额归还贷款本息即视为逾期，从逾期之日起，按实际逾期天数对逾期本金按照本合同约定的违约金比例计收逾期违约金，直至清偿逾期本息为止，违约金比例以本合同首部所载信息为准;如您存在两期以上逾期的，则各期的逾期违约金需累加计算。
        </div>
        <div className="contract-section">
          10.4 贷款人因向您催告还款及实现债权所产生的一切费用(即实现债权的费用，包括但不限于公证费、诉讼费、律师费、差旅费、催告还款费)，均由您承担。
        </div>
        <div className="contract-section">
          10.5 贷款人软(硬)件系统出现下列任一状况而无法正常运作，致使无法向您提供本服务，贷款人对此免予承担责任，但贷款人会尽合理努力向您进行及时告知，并在合理范围内采取措施减轻对您使用本服务造成的不利影响，同时积极促使服务恢复正常，该状况包括但不限于:
        </div>
        <div className="contract-section">
          (1) 因电信设备出现故障，或由于网络攻击、网络拥堵、信誉畅享贷服务依赖的相关服务商、企事业单位、银行方面等原因造成的服务中断或者延迟;
        </div>
        <div className="contract-section">
          (2) 因台风、地震、海啸、洪水、停电、战争、恐怖袭击等不可抗力之因素，造成本服务运行系统障碍不能执行业务等。
        </div>
        <div className="contract-section">
          <strong>11. 争议解决</strong>
        </div>
        <div className="contract-section">
          11.1 若您和贷款人之间发生任何纠纷或争议，首先应友好协商解决，协商不成时原告有权选择以下任何一个有管辖权的人民法院进行诉讼:(1)贷款人及其分支机构所在地、办事机构所在地;(2)合同签订地(含电子签章所在地);(3)合同履行地;(4)债权受让人所在地;(5)双方若通过调解组织解决争议，若协商调解不成，任一方可选择在该调解组织所在地法院进行诉讼。
        </div>
        <div className="contract-section">
          11.2 您确认并同意，对于本合同签署、履行、终止过程中所形成的任何电子合同、电子信息记录或数据(如有)以及相关信息系统中所提取的数据等均具有法律效力，认可其证据的有效性、真实性。
        </div>
        <div className="contract-section">
          11.3 本合同条款无论因何种原因部分无效或不可执行，其余条款仍有效，对双方具有约束力。
        </div>
        <div className="contract-section">
          <strong>12. 通知与送达</strong>
        </div>
        <div className="contract-section">
          12.1 您向贷款人提供的资料及信息(包括但不限于姓名、国籍、住所地、工作单位、联系电话、身份证件或者身份证明文件的号码、有效期等身份信息)发生变更的，应在信息发生变更之日起7日内联系在线客服更新相关信息。
        </div>
        <div className="contract-section">
          12.2 贷款人就本合同给予您的任何通知、要求或其它函件，一经发送到您向贷款人提供的信息中所示的地址或以短信形式发送至您的手机号码或在花花、花花金融(包括但不限于APP、网站、小程序等)发送站内信、通知或进行公告、公示等，即视为已送达，因您不及时变更信息而引起的责任及产生的损失，由您自行承担。
        </div>
        <div className="contract-section">
          12.3 您同意法院或仲裁机构按照本合同附件《送达地址确认书》的约定向您送达法律文书。
        </div>
        <div className="contract-section">
          12.4 发生逾期等违约情形后，涉诉标的额超过受诉法院所在省、自治区、直辖市上年度就业人员平均工资百分之五十但在二倍以下的，双方同意适用小额诉讼程序审理，一审终审。
        </div>
        <div className="contract-section">
          <strong>13. 特别提示</strong>
        </div>
        <div className="contract-section">
          13.1 您知悉并确认，如逾期偿还欠款贷款人有权对您提起诉讼，并决定是否申请强制执行，若贷款人申请强制执行，执行中贷款人有权申请法院对您采取账户冻结、列入失信被执行人名单，限制高消费等一切强制措施，这将对您的征信、生活、工作及子女教育等多方面产生重大不利影响(包括但不限于被限制坐高铁、飞机、限制高消费等)。
        </div>
        <div className="contract-section">
          13.2 本合同签署前，贷款人已提请您对本合同各项条款，作全面、准确的理解，并应其要求对相应条款作了说明，贷款人已特别提醒您注意本合同内黑色字体条款，您已明确所有条款及相关法律专业术语含义，确认对上述合同内容不存在误解或疑义。
        </div>
        <div className="contract-section">
          <strong>14. 其他</strong>
        </div>
        <div className="contract-section">
          14.1 贷款人所公布的服务收费标准、附件、您的单笔借据等均是本合同不可分割的部分，与本合同具有同等法律效力。
        </div>
        <div className="contract-section">
          14.2 本合同未尽事宜，以您另行签署的《授信及服务协议》为准。
        </div>
        <div className="contract-section">
          14.3 本合同所附附件及未来可能签署的补充协议、承诺声明等均为本合同不可分割的组成部分，与本合同具有同等法律效力。
        </div>

        {/* 签章区域 */}
        <div className="signature-section">
          <div className="signature-line" id="company_seal">
            公司盖章：<span id="company_seal_name">{displayData.company_seal_name || '分期付企业管理有限公司云南分公司'}</span>
          </div>
          <div className="signature-line" style={{ display: 'flex', alignItems: 'center' }}>
            法人签字：李君龙
            <img 
              src="/resources/images/zw.jpg" 
              alt="指纹" 
              style={{ marginLeft: '12px', width: '80px', height: 'auto' }} 
              onError={(e) => {
                // 如果图片加载失败，隐藏图片
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div className="signature-line">
            法制顾问：王永廷 <span className="contract-red">【王永廷】</span>
          </div>
          <div className="signature-line">业务办理人：雷再华</div>
          <div className="foot-note contract-red">
            注意事项：<br />1.如因申请人伪造贷款资料，或者恶意骗贷等行为我司将直接向法院起诉。
          </div>
          {/* 章覆盖签字日期 */}
          <div className="signature-date">
            <div>签订日期： <p id="date_text">{displayData.date_text || new Date().toLocaleDateString('zh-CN')}</p></div>
            <div>合同编号：{displayData.contract_no || 'XA-56PR36647'}</div>
            <img 
              src="/resources/images/zhang.jpg" 
              alt="公司章" 
              className="company-seal"
              onError={(e) => {
                // 如果图片加载失败，隐藏图片
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部下载合同按钮 */}
      <div className="download-btn-container">
        <button onClick={downloadContract} className="download-btn" type="button">
          📄 下载Word合同
        </button>
      </div>
    </div>
  )
}

