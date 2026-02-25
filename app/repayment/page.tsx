'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image as ImageIcon } from 'lucide-react';
import FooterNav from '@/components/FooterNav';
import { getCurrentUser } from '@/lib/api';

export default function RepaymentPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loanData, setLoanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userInfo = getCurrentUser();
      if (!userInfo || !userInfo.phone) {
        router.push('/login');
        return;
      }

      // 从API获取用户数据
      const response = await fetch(`/api/get_user_data?phone=${encodeURIComponent(userInfo.phone)}`);
      const result = await response.json();

      if (result.code === 200 && result.data) {
        setLoanData(result.data);
      } else {
        // 如果获取失败，使用默认数据
        setLoanData({
          loanAmount: '0.00',
          paidAmount: '0.00',
          interestRate: '10.88%',
          loanDate: '',
          cycle: '随借随还',
          dueDate: '',
          totalInterest: '0.00',
          status: '正常',
          overdueAmount: '0.00',
          totalRepayment: '0.00'
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 使用默认数据
      setLoanData({
        loanAmount: '0.00',
        paidAmount: '0.00',
        interestRate: '10.88%',
        loanDate: '',
        cycle: '随借随还',
        dueDate: '',
        totalInterest: '0.00',
        status: '正常',
        overdueAmount: '0.00',
        totalRepayment: '0.00'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setUploadStatus(`已选择 ${files.length} 张图片`);
    }
  };

  if (loading || !loanData) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col max-w-[560px] mx-auto pb-24">
        <div className="bg-white m-4 rounded-lg shadow-sm p-4 text-center">
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-[560px] mx-auto pb-24">
      {/* Main Card */}
      <div className="bg-white m-4 rounded-lg shadow-sm p-4">
        <h2 className="mb-4">分期付 欢迎您</h2>
        
        {/* Loan Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">借款金额</span>
            <span className="text-gray-900">{loanData.loanAmount}元</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">已还金额</span>
            <span className="text-gray-900">{loanData.paidAmount}元</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">年化利率</span>
            <span className="text-gray-900">{loanData.interestRate}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">放款时间</span>
            <span className="text-gray-900">{loanData.loanDate}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">周期</span>
            <span className="text-gray-900">{loanData.cycle}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">到期日期</span>
            <span className="text-gray-900">{loanData.dueDate}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">总利息</span>
            <span className="text-gray-900">¥ {loanData.totalInterest}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm" style={{ color: '#dc2626' }}>
            <span style={{ color: '#dc2626' }}>借款状态</span>
            <span style={{ color: '#dc2626' }}>{loanData.status}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm" style={{ color: '#dc2626' }}>
            <span style={{ color: '#dc2626' }}>逾期金额</span>
            <span style={{ color: '#dc2626' }}>¥ {loanData.overdueAmount}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm" style={{ color: '#dc2626' }}>
            <span style={{ color: '#dc2626' }}>总还款金额</span>
            <span style={{ color: '#dc2626' }}>¥ {loanData.totalRepayment}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors"
            type="button"
            onClick={() => router.push('/repay_confirm')}
          >
            一键还款
          </button>
          <button 
            className="flex-1 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 py-3 rounded-lg transition-colors"
            type="button"
            onClick={() => {
              // 传递用户数据到合同页面
              const params = new URLSearchParams({
                userId: loanData.user_id?.toString() || '',
                name: loanData.name || '',
                phone: loanData.phone || '',
                idNumber: loanData.id_number || '',
                loanNumber: loanData.loan_number || '',
                bankCard: loanData.bank_card || '',
                amount: loanData.loanAmount || '0'
              });
              router.push(`/contract?${params.toString()}`);
            }}
          >
            贷款合同
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white m-4 mt-0 rounded-lg shadow-sm p-4">
        <h3 className="text-center mb-3">上传凭证图片</h3>
        
        <div className="mb-3">
          <label htmlFor="fileInput" className="sr-only">选择图片文件</label>
          <input
            type="file"
            id="fileInput"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="选择图片文件"
          />
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="w-full py-3 rounded-lg text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #52c41a, #73d13d)',
              border: '2px solid #52c41a',
              color: '#ffffff'
            }}
            type="button"
          >
            <Upload className="w-5 h-5" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>选择图片</span>
          </button>
        </div>
        
        {uploadStatus && (
          <div className="text-center text-sm p-2 rounded bg-blue-50 text-blue-600 border border-blue-200 mb-3">
            {uploadStatus}
          </div>
        )}
        
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {selectedFiles.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border border-gray-200"
              />
            ))}
          </div>
        )}
        
        <div className="text-center text-gray-400 text-xs mb-3">
          长按图片可保存，点击图片可全屏预览
        </div>
        
        <button
          className="w-full py-3 rounded-lg text-white transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
            border: '2px solid #1890ff',
            color: '#ffffff'
          }}
          type="button"
        >
          <ImageIcon className="w-5 h-5" style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>查看图片</span>
        </button>
      </div>

      {/* Repayment Period Notice */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-400">
          全额还款模式，无需分期
        </div>
      </div>

      {/* Bottom Navigation */}
      <FooterNav />
    </div>
  );
}
