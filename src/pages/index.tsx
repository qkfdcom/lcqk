import { useState, useEffect } from 'react';
import { getUserData } from '@/utils/data';
import { UserNote, UserStatus } from '@/types';
import Link from 'next/link';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'warning' | 'danger'>('warning');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // 固定每页显示20条
  const [jumpPage, setJumpPage] = useState('');

  useEffect(() => {
    getUserData()
      .then(data => {
        setAllUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError('加载数据失败');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-xl font-semibold">{error}</div>
      </div>
    );
  }

  // 根据当前标签筛选用户
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tag.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'normal') return user.status === 'normal';
    if (activeTab === 'warning') return user.status === 'warning';
    if (activeTab === 'danger') return user.status === 'danger';
    return true;
  });

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 animate-fade-in">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link 
              href="/"
              className="flex-shrink-0 flex items-center group transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  链查区块
                  <span className="text-base ml-2 text-gray-500 font-normal">
                    Web3用户信息库
                  </span>
                </h1>
                <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2 sm:mx-4" />
                <span className="text-base sm:text-lg font-medium text-blue-600 transition-all duration-300 transform translate-x-0 hover:translate-x-2">
                  LCQK.com
                </span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* 搜索区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-up">
          <div className="relative group">
            <input
              type="text"
              placeholder="搜索用户名或备注信息..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm group-hover:shadow-md bg-white/80 backdrop-blur-sm"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-1 flex space-x-1">
            {[
              { id: 'all', label: '全部', count: allUsers.length },
              { id: 'normal', label: '普通名单', count: allUsers.filter(u => u.status === 'normal').length },
              { id: 'warning', label: '警告名单', count: allUsers.filter(u => u.status === 'warning').length },
              { id: 'danger', label: '危险名单', count: allUsers.filter(u => u.status === 'danger').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`
                  flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <span>{tab.label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    备注信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-gray-200">
                {currentUsers.map((user, index) => (
                  <tr 
                    key={user.username}
                    className="hover:bg-white/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://x.com/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        @{user.username}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.tag}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> 到{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> 条，
                    共 <span className="font-medium">{filteredUsers.length}</span> 条
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">每页显示：</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newItemsPerPage = parseInt(e.target.value);
                        setItemsPerPage(newItemsPerPage);
                        // 调整当前页码，确保不会超出范围
                        const newTotalPages = Math.ceil(filteredUsers.length / newItemsPerPage);
                        if (currentPage > newTotalPages) {
                          setCurrentPage(newTotalPages);
                        }
                      }}
                      className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[20, 50, 100, 200, 500, 1000].map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-600">条</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">首页</span>
                      <span>首页</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">上一页</span>
                      <span>上一页</span>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">下一页</span>
                      <span>下一页</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">末页</span>
                      <span>末页</span>
                    </button>
                  </nav>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm text-gray-600">跳至</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpPage}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 允许输入框为空
                        if (value === '') {
                          setJumpPage('');
                          return;
                        }
                        // 只允许输入数字
                        if (/^\d+$/.test(value)) {
                          setJumpPage(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        // 按回车时跳转
                        if (e.key === 'Enter') {
                          const page = parseInt(jumpPage);
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                          } else {
                            setJumpPage(currentPage.toString());
                          }
                        }
                      }}
                      onBlur={() => {
                        // 失去焦点时验证并更新
                        const page = parseInt(jumpPage);
                        if (!page || page < 1) {
                          setJumpPage('1');
                          setCurrentPage(1);
                        } else if (page > totalPages) {
                          setJumpPage(totalPages.toString());
                          setCurrentPage(totalPages);
                        } else {
                          setJumpPage(page.toString());
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">页</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 修改状态标签组件
function StatusBadge({ status }: { status: UserStatus }) {
  const styles = {
    normal: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
    warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800',
    danger: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
  };

  const labels = {
    normal: '普通',
    warning: '警告',
    danger: '危险'
  };

  return (
    <span className={`
      px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm
      transition-transform duration-200 hover:scale-105 active:scale-95
      ${styles[status]}
    `}>
      {labels[status]}
    </span>
  );
}
