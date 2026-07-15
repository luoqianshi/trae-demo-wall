import { useState } from 'react';

interface RegistrationPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function RegistrationPage({ onNavigate }: RegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectName: '一扫就会用',
    teamName: '',
    members: '',
    description: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-4 bg-white hover:bg-gray-50 text-gray-700 text-lg font-bold py-2 px-4 rounded-full appliance-button shadow-md"
        >
          ← 返回首页
        </button>

        {submitted ? (
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">报名成功!</h1>
            <p className="text-xl text-gray-600 mb-6">
              感谢您的报名，我们会尽快与您联系。
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-8 rounded-xl appliance-button shadow-lg"
            >
              返回首页
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">📝</div>
              <h1 className="text-3xl font-bold text-blue-700">大赛报名</h1>
              <p className="text-lg text-gray-600">填写信息，参与创造力大赛</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  手机号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="请输入您的手机号"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="请输入您的邮箱"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-blue-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  团队名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  required
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="请输入团队名称"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  团队成员 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="members"
                  value={formData.members}
                  onChange={handleChange}
                  required
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="请输入团队成员姓名，用逗号分隔"
                />
              </div>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  项目简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="请简要介绍您的项目..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-6 rounded-xl appliance-button shadow-lg"
              >
                提交报名
              </button>
            </form>

            <div className="mt-6 bg-blue-50 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-blue-700 mb-3">📌 报名须知</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>报名截止日期：2026年7月15日</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>初赛作品需于7月15日前提交</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>提交材料包括：项目演示视频、创意提案文档</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>详情请关注大赛官方通知</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
