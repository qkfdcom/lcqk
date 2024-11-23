const TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAN2ZwwEAAAAAqmPoliGWujcXMQRG1%2B9jaLWAK7o%3DMewLT6wyCwKFcn93RumVkpeYicexfIxr0E3n9s3zXA2jyusc0A';

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 添加重试装饰器
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 5000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1} failed, waiting ${delayMs}ms before retry...`);
      
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        // 如果是速率限制错误，等待更长时间
        await delay(delayMs * 2);
      } else {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError!;
}

export async function getTwitterUserId(username: string): Promise<string> {
  return withRetry(async () => {
    const cleanUsername = username.replace('@', '').trim();
    console.log('Fetching ID for username:', cleanUsername);
    
    const url = `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=id,username,name`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Accept': 'application/json',
      },
      method: 'GET',
      cache: 'no-cache',
    });
    
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    
    if (response.status === 401) {
      throw new Error('Authentication error');
    }

    if (!response.ok) {
      throw new Error(`Twitter API Error: ${response.status}`);
    }

    const data = JSON.parse(responseText);
    
    if (!data.data?.id) {
      throw new Error('No user ID in response');
    }

    return data.data.id;
  }, 3, 5000); // 3次重试，每次等待5秒
}

export async function getBatchTwitterUserIds(usernames: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  console.log('Starting batch fetch for usernames:', usernames);
  
  // 每批处理的用户数量
  const batchSize = 3;
  // 批次间的延迟时间（毫秒）
  const batchDelay = 10000;
  
  // 将用户名分成小批次
  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usernames.length / batchSize)}`);
    
    // 并行处理每个批次中的请求
    const batchPromises = batch.map(async username => {
      try {
        const id = await getTwitterUserId(username);
        if (id) {
          result[username] = id;
          console.log(`Successfully got ID ${id} for ${username}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ID for ${username}:`, error);
      }
    });
    
    // 等待当前批次完成
    await Promise.all(batchPromises);
    
    // 如果还有更多批次要处理，等待一段时间
    if (i + batchSize < usernames.length) {
      console.log(`Waiting ${batchDelay}ms before next batch...`);
      await delay(batchDelay);
    }
  }

  return result;
} 