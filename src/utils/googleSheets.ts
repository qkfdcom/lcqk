import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { UserNote } from '@/types';

export async function getSheetData(): Promise<UserNote[]> {
  try {
    console.log('Creating JWT client...');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    console.log('Initializing sheets API...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // 获取所有工作表的数据
    const [yellowData, blackData, normalData] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: '1N0Q9qaupJ71wOr4a0wtQc2uFZHizx-c6qK2o1iZhlf8',
        range: 'yellow_list!A2:B'  // 从第2行开始，A和B列
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: '1N0Q9qaupJ71wOr4a0wtQc2uFZHizx-c6qK2o1iZhlf8',
        range: 'black_list!A2:B'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: '1N0Q9qaupJ71wOr4a0wtQc2uFZHizx-c6qK2o1iZhlf8',
        range: 'normal_list!A2:B'
      })
    ]);

    // 处理每个工作表的数据
    const processRows = (rows: any[] | undefined, status: 'normal' | 'warning' | 'danger'): UserNote[] => {
      if (!rows || !Array.isArray(rows.values)) return [];
      return rows.values
        .filter((row: string[]) => row[0] && row[1])
        .map((row: string[]) => ({
          user_id: row[0].trim(),
          tag: row[1].trim(),
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
    };

    // 合并所有数据
    const users: UserNote[] = [
      ...processRows(yellowData.data, 'warning'),
      ...processRows(blackData.data, 'danger'),
      ...processRows(normalData.data, 'normal')
    ];

    console.log(`Processed ${users.length} total users`);
    return users;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// 保存数据到本地JSON文件
export async function saveToJsonFiles(users: UserNote[]): Promise<void> {
  try {
    // 按状态分组
    const groupedUsers = users.reduce((acc, user) => {
      acc[user.status] = acc[user.status] || [];
      acc[user.status].push({
        user_id: user.user_id,
        tag: user.tag
      });
      return acc;
    }, {} as Record<string, any[]>);

    // 确保目录存在
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 保存文件前先打印数据
    console.log('Grouped users:', groupedUsers);

    // 保存普通用户
    const normalPath = path.join(dataDir, 'normal_list.json');
    fs.writeFileSync(normalPath, JSON.stringify({ users: groupedUsers.normal || [] }, null, 2));
    console.log(`Saved ${groupedUsers.normal?.length || 0} normal users`);

    // 保存警告用户
    const warningPath = path.join(dataDir, 'yellow_list.json');
    fs.writeFileSync(warningPath, JSON.stringify({ users: groupedUsers.warning || [] }, null, 2));
    console.log(`Saved ${groupedUsers.warning?.length || 0} warning users`);

    // 保存危险用户
    const dangerPath = path.join(dataDir, 'black_list.json');
    fs.writeFileSync(dangerPath, JSON.stringify({ users: groupedUsers.danger || [] }, null, 2));
    console.log(`Saved ${groupedUsers.danger?.length || 0} danger users`);

  } catch (error) {
    console.error('Error saving to JSON files:', error);
    throw error;
  }
} 