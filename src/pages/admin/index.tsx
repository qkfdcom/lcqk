import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserNote } from '@/types';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'import' | 'settings' | 'logs'>('users');
  const [users, setUsers] = useState<UserNote[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleSetup2FA = async () => {
    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSetupMode(true);
      } else {
        alert('设置失败');
      }
    } catch (error) {
      console.error('Setup error:', error);
      alert('设置失败');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password,
          code: code2FA 
        }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        setIsLoggedIn(true);
      } else {
        alert('登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  // 获取用户数据
  const fetchUsers = async () => {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  };

  // 获取操作日志
  const fetchLogs = async () => {
    const response = await fetch('/api/logs');
    const data = await response.json();
    setLogs(data);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
      fetchLogs();
    }
  }, [isLoggedIn]);

  // 导出数据
  const handleExport = (type: 'all' | 'normal' | 'warning' | 'danger') => async () => {
    try {
      const response = await fetch(`/api/export?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lcqk-${type}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败');
    }
  };

  // 导入数据
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({
            type,
            data
          })
        });

        if (response.ok) {
          alert(`${type === 'normal' ? '普通' : type === 'warning' ? '警告' : '危险'}名单导入成功`);
          fetchUsers();
        } else {
          alert('导入失败');
        }
      } catch (error) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  // 添加倒计时组件
  function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
      // 计算当前验证码的剩余时间
      const initialTime = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeLeft(initialTime);

      // 每秒更新倒计时
      const timer = setInterval(() => {
        const newTimeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
        setTimeLeft(newTimeLeft);
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    // 计算进度条宽度
    const progressWidth = (timeLeft / 30) * 100;

    return (
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1 text-center">
          验证码有效期：{timeLeft}秒
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6">后台管理登录</h1>
          {setupMode ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
                <p className="mt-2 text-sm text-gray-600">
                  请使用谷歌验证器扫描二维码
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  密钥: {secret}
                </p>
              </div>
              <button
                onClick={() => setSetupMode(false)}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                完成设置
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="请输入管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <CountdownTimer />
              </div>
              <button
                onClick={handleLogin}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                登录
              </button>
              <div className="text-center">
                <button
                  onClick={handleSetup2FA}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  设置双重认证
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">后台管理</h1>
              <div className="ml-10 flex space-x-4">
                <TabButton 
                  active={activeTab === 'users'} 
                  onClick={() => setActiveTab('users')}
                >
                  用户管理
                </TabButton>
                <TabButton 
                  active={activeTab === 'import'} 
                  onClick={() => setActiveTab('import')}
                >
                  数据导入导出
                </TabButton>
                <TabButton 
                  active={activeTab === 'settings'} 
                  onClick={() => setActiveTab('settings')}
                >
                  系统设置
                </TabButton>
                <TabButton 
                  active={activeTab === 'logs'} 
                  onClick={() => setActiveTab('logs')}
                >
                  操作日志
                </TabButton>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">用户管理</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.username}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4">{user.tag}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                          编辑
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 数据导入导出 */}
        {activeTab === 'import' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">数据导入导出</h2>
            <div className="space-y-6">
              {/* 导出部分 */}
              <div>
                <h3 className="text-lg font-medium mb-4">导出数据</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={handleExport('all')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    导出全部数据
                  </button>
                  <button
                    onClick={handleExport('normal')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    导出普通名单
                  </button>
                  <button
                    onClick={handleExport('warning')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    导出警告名单
                  </button>
                  <button
                    onClick={handleExport('danger')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    导出危险名单
                  </button>
                </div>
              </div>

              {/* 导入部分 */}
              <div>
                <h3 className="text-lg font-medium mb-4">导入数据</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['normal', 'warning', 'danger'].map((type) => (
                    <div key={type} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 capitalize">{type === 'normal' ? '普通' : type === 'warning' ? '警告' : '危险'}名单</h4>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleImport(e, type)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 系统设置 */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">系统设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  每页显示数量
                </label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  自动备份
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2">启用每日自动备份</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作日志 */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">操作日志</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      详情
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-6 py-4">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 标签按钮组件
function TabButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// 状态标签组件
function StatusBadge({ status }: { status: string }) {
  const styles = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };

  const labels = {
    normal: '普通',
    warning: '警告',
    danger: '危险'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
      styles[status as keyof typeof styles]
    }`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
} 