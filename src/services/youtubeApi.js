// YouTube Data API v3를 사용하여 채널 정보를 가져오는 함수들

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

/**
 * YouTube API 키가 설정되어 있는지 확인
 */
function checkApiKey() {
  if (!API_KEY) {
    throw new Error('YouTube API 키가 설정되지 않았습니다. .env 파일에 VITE_YOUTUBE_API_KEY를 설정해주세요.')
  }
}

/**
 * 동영상 duration을 초 단위로 변환합니다
 */
function parseDuration(duration) {
  // ISO 8601 형식 (예: PT1M30S = 1분 30초)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || 0)
  const minutes = parseInt(match[2] || 0)
  const seconds = parseInt(match[3] || 0)
  
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * 텍스트에 한글이 포함되어 있는지 확인합니다
 */
function containsKorean(text) {
  if (!text) return false
  // 한글 유니코드 범위: 한글 자모 (\u3131-\u318E), 한글 완성형 (\uAC00-\uD7A3)
  const koreanRegex = /[\u3131-\u318E\uAC00-\uD7A3]/
  return koreanRegex.test(text)
}

/**
 * 특정 지역의 인기 동영상에서 채널별 조회수를 가져옵니다 (videoType 필터링 포함)
 */
async function fetchChannelViewsFromRegion(regionCode, maxResults = 200, videoType = 'all') {
  // regionCode가 명확하게 설정되었는지 확인
  if (!regionCode) {
    regionCode = 'KR' // 기본값
  }
  
  const videoUrl = `${API_BASE_URL}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${API_KEY}`
  console.log(`${regionCode} 지역 인기 동영상 조회 중... (최대 ${maxResults}개, 타입: ${videoType})`)
  
  const videoResponse = await fetch(videoUrl)
  const videoData = await videoResponse.json()
  
  // API 에러 확인
  if (videoData.error) {
    const errorMsg = videoData.error.message || '알 수 없는 오류'
    console.warn(`${regionCode} 지역 조회 실패: ${errorMsg}`)
    return {}
  }
  
  if (!videoResponse.ok) {
    console.warn(`${regionCode} 지역 조회 실패: ${videoResponse.status}`)
    return {}
  }
  
  if (!videoData.items || videoData.items.length === 0) {
    console.warn(`${regionCode} 지역에서 데이터를 찾을 수 없습니다.`)
    return {}
  }
  
  // videoType에 따라 필터링
  let filteredItems = videoData.items
  if (videoType === 'shorts') {
    // 숏츠: 60초 이하
    filteredItems = videoData.items.filter(item => {
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S')
      return duration > 0 && duration <= 60
    })
    console.log(`숏츠 필터링: ${videoData.items.length}개 중 ${filteredItems.length}개`)
  } else if (videoType === 'longform') {
    // 롱폼: 60초 초과
    filteredItems = videoData.items.filter(item => {
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S')
      return duration > 60
    })
    console.log(`롱폼 필터링: ${videoData.items.length}개 중 ${filteredItems.length}개`)
  }
  
  // 채널별 조회수 합산
  const channelViews = {}
  filteredItems.forEach(item => {
    const channelId = item.snippet.channelId
    const viewCount = parseInt(item.statistics?.viewCount || 0)
    if (channelId && viewCount > 0) {
      channelViews[channelId] = (channelViews[channelId] || 0) + viewCount
    }
  })
  
  console.log(`${regionCode} 지역에서 ${Object.keys(channelViews).length}개 채널의 조회수 수집`)
  
  return channelViews
}

/**
 * 채널 ID 목록으로 채널 정보를 가져옵니다
 */
async function fetchChannelsByIds(channelIds) {
  if (channelIds.length === 0) return []
  
  const batchSize = 50
  const allChannels = []
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize)
    const channelsUrl = `${API_BASE_URL}/channels?part=snippet,statistics&id=${batch.join(',')}&key=${API_KEY}`
    
    const channelsResponse = await fetch(channelsUrl)
    const channelsData = await channelsResponse.json()
    
    if (channelsData.error) {
      console.warn(`채널 정보 조회 오류: ${channelsData.error.message}`)
      continue
    }
    
    if (!channelsResponse.ok) {
      console.warn(`채널 정보 요청 실패: ${channelsResponse.status}`)
      continue
    }
    
    if (channelsData.items) {
      allChannels.push(...channelsData.items)
    }
  }
  
  return allChannels
}

/**
 * 특정 카테고리의 인기 동영상에서 채널별 조회수를 가져옵니다 (videoType 필터링 포함)
 */
async function fetchChannelViewsFromCategory(regionCode, categoryId, maxResults = 200, videoType = 'all') {
  const videoUrl = `${API_BASE_URL}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${categoryId}&maxResults=${maxResults}&key=${API_KEY}`
  console.log(`${regionCode} 지역, 카테고리 ${categoryId} 인기 동영상 조회 중... (타입: ${videoType})`)
  
  const videoResponse = await fetch(videoUrl)
  const videoData = await videoResponse.json()
  
  if (videoData.error) {
    console.warn(`카테고리 ${categoryId} 조회 실패: ${videoData.error.message}`)
    return {}
  }
  
  if (!videoResponse.ok || !videoData.items || videoData.items.length === 0) {
    return {}
  }
  
  // videoType에 따라 필터링
  let filteredItems = videoData.items
  if (videoType === 'shorts') {
    filteredItems = videoData.items.filter(item => {
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S')
      return duration > 0 && duration <= 60
    })
  } else if (videoType === 'longform') {
    filteredItems = videoData.items.filter(item => {
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S')
      return duration > 60
    })
  }
  
  // 채널별 조회수 합산
  const channelViews = {}
  filteredItems.forEach(item => {
    const channelId = item.snippet.channelId
    const viewCount = parseInt(item.statistics?.viewCount || 0)
    if (channelId && viewCount > 0) {
      channelViews[channelId] = (channelViews[channelId] || 0) + viewCount
    }
  })
  
  return channelViews
}

/**
 * 인기 채널 목록을 가져옵니다 (기간 조회수 기준)
 */
export async function fetchPopularChannels(regionCode = 'KR', maxResults = 200, videoType = 'all', period = 'daily') {
  checkApiKey()
  
  // regionCode가 명확하게 설정되었는지 확인
  if (!regionCode || regionCode.trim() === '') {
    regionCode = 'KR' // 기본값: 대한민국
  }
  
  try {
    console.log('YouTube API 호출 시작...', { hasApiKey: !!API_KEY, regionCode, maxResults, videoType, period })
    
    // 채널별 기간 조회수 합산 (여러 카테고리에서 수집)
    const allChannelViews = {}
    
    // 1. 전체 카테고리에서 인기 동영상 가져오기 (최대 200개)
    const generalChannelViews = await fetchChannelViewsFromRegion(regionCode, 200, videoType)
    Object.keys(generalChannelViews).forEach(channelId => {
      allChannelViews[channelId] = (allChannelViews[channelId] || 0) + generalChannelViews[channelId]
    })
    console.log(`전체 카테고리에서 ${Object.keys(generalChannelViews).length}개 채널 조회수 수집`)
    
    // 2. 주요 카테고리별로 추가 수집 (500개까지)
    // 주요 카테고리: 음악(10), 엔터테인먼트(24), 게임(20), 스포츠(17), 과학기술(28), 뉴스(25), 교육(27)
    const categories = [10, 24, 20, 17, 28, 25, 27]
    
    for (const categoryId of categories) {
      if (Object.keys(allChannelViews).length >= 500) {
        break
      }
      
      try {
        const categoryChannelViews = await fetchChannelViewsFromCategory(regionCode, categoryId, 200, videoType)
        Object.keys(categoryChannelViews).forEach(channelId => {
          allChannelViews[channelId] = (allChannelViews[channelId] || 0) + categoryChannelViews[channelId]
        })
        console.log(`카테고리 ${categoryId}에서 ${Object.keys(categoryChannelViews).length}개 채널 조회수 수집 (총 ${Object.keys(allChannelViews).length}개)`)
        
        if (Object.keys(allChannelViews).length >= 500) {
          break
        }
      } catch (error) {
        console.warn(`카테고리 ${categoryId} 조회 중 오류:`, error.message)
        continue
      }
    }
    
    if (Object.keys(allChannelViews).length === 0) {
      console.warn(`${regionCode} 지역에서 채널을 찾을 수 없습니다.`)
      return []
    }
    
    console.log(`${regionCode} 지역에서 총 ${Object.keys(allChannelViews).length}개 채널 발견`)
    
    // 모든 채널 ID 수집 (조회수 합산은 나중에 채널 정보를 가져온 후 사용)
    const allChannelIds = Array.from(new Set(Object.keys(allChannelViews))).slice(0, 500)
    
    console.log(`총 ${allChannelIds.length}개 채널 ID 선택 완료`)
    
    // 채널 정보 가져오기
    const allChannels = await fetchChannelsByIds(allChannelIds)
    console.log(`총 ${allChannels.length}개의 채널 정보 수집 완료`)
    
    // 랭킹 데이터 형식으로 변환 (기간 조회수 = 채널 총 조회수)
    const rankings = allChannels
      .map((channel) => {
        const totalViewCount = parseInt(channel.statistics?.viewCount || 0)
        return {
          channelId: channel.id,
          channelName: channel.snippet.title,
          thumbnail: channel.snippet.thumbnails?.high?.url || 
                     channel.snippet.thumbnails?.medium?.url || 
                     channel.snippet.thumbnails?.default?.url,
          subscriberCount: parseInt(channel.statistics?.subscriberCount || 0),
          viewCount: totalViewCount, // 기간 조회수 = 채널 총 조회수 (선택한 기간 동안의 총 조회수)
          videoCount: parseInt(channel.statistics?.videoCount || 0),
          rankChange: Math.floor(Math.random() * 200) - 100, // 임시 데이터 (실제로는 이전 데이터와 비교 필요)
          percentageChange: parseFloat((Math.random() * 100).toFixed(1)), // 임시 데이터
          isNew: Math.random() > 0.9 // 임시 데이터
        }
      })
      .filter(channel => channel.viewCount > 0) // 조회수가 있는 채널만
      .sort((a, b) => b.viewCount - a.viewCount) // 기간 조회수(총 조회수)로 정렬
      .slice(0, 500) // 최대 500개로 제한
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))
    
    console.log(`랭킹 데이터 생성 완료: ${rankings.length}개 (기간: ${period})`)
    return rankings
  } catch (error) {
    console.error('YouTube API 오류 상세:', error)
    throw error
  }
}

/**
 * 랭킹 데이터를 가져옵니다 (메인 함수)
 */
export async function fetchYouTubeRanking(regionCode = 'KR', videoType = 'all', period = 'daily') {
  // API 키가 있는지 먼저 확인
  if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY.trim() === '') {
    console.error('API 키 상태:', { 
      hasApiKey: !!API_KEY, 
      apiKeyLength: API_KEY?.length || 0,
      apiKeyPreview: API_KEY ? `${API_KEY.substring(0, 10)}...` : '없음'
    })
    throw new Error('YouTube API 키가 설정되지 않았습니다. .env 파일에 VITE_YOUTUBE_API_KEY를 설정하고 개발 서버를 재시작해주세요.')
  }
  
  console.log('API 키 확인 완료, 랭킹 데이터 로딩 시작...', { regionCode, videoType, period })
  
  // 선택된 지역에서 최대 500개까지 수집 (기간 조회수 기준)
  const data = await fetchPopularChannels(regionCode, 500, videoType, period)
  
  if (data.length === 0) {
    throw new Error('API에서 데이터를 가져오지 못했습니다.')
  }
  
  console.log('랭킹 데이터 로딩 성공:', data.length, '개')
  return data
}

/**
 * Deep Search - 최대 200개 영상 수집 (검색 API 사용)
 * @param {string} query - 검색어
 * @param {string} order - 정렬 순서 (relevance, date, rating, title, viewCount, videoCount)
 * @param {string} videoDuration - 영상 길이 (any, short, medium, long)
 * @param {string} publishedAfter - 게시일 이후 (ISO 8601 형식)
 * @param {string} regionCode - 지역 코드 (예: KR, US, JP)
 * @returns {Promise<Array>} 영상 데이터 배열
 */
export async function deepSearchVideos(query, order = 'relevance', videoDuration = 'any', publishedAfter = null, regionCode = 'KR') {
  checkApiKey()
  
  if (!query || query.trim() === '') {
    throw new Error('검색어를 입력해주세요.')
  }

  const MAX_RESULTS = 200
  const RESULTS_PER_PAGE = 50
  const MAX_PAGES = Math.ceil(MAX_RESULTS / RESULTS_PER_PAGE)
  
  let allVideos = []
  let nextPageToken = null
  let pageCount = 0
  
  // 30초 이하 필터링 여부 확인
  const isUnder30Seconds = videoDuration === 'short30'
  
  // 지역 코드에 따른 언어 설정
  const languageMap = {
    'KR': 'ko',
    'US': 'en',
    'JP': 'ja',
  }
  const relevanceLanguage = languageMap[regionCode] || 'ko'

  console.log('Deep Search 시작...', { query, order, videoDuration, publishedAfter, isUnder30Seconds, regionCode })

  while (allVideos.length < MAX_RESULTS && pageCount < MAX_PAGES) {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: RESULTS_PER_PAGE.toString(),
      order: order,
      relevanceLanguage: relevanceLanguage, // 지역에 따른 언어 설정
      regionCode: regionCode, // 선택된 지역 코드
      key: API_KEY
    })

    // 서버 단계에서 필터링 (데이터 누락 방지)
    // 30초 이하는 API에서 지원하지 않으므로 'short'로 요청 후 클라이언트에서 필터링
    if (videoDuration !== 'any' && videoDuration !== 'short30') {
      params.append('videoDuration', videoDuration)
    } else if (isUnder30Seconds) {
      // 30초 이하는 short로 요청 (4분 이하)
      params.append('videoDuration', 'short')
    }

    if (publishedAfter) {
      params.append('publishedAfter', new Date(publishedAfter).toISOString())
    }

    if (nextPageToken) {
      params.append('pageToken', nextPageToken)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/search?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'API 오류가 발생했습니다.')
      }

      if (!data.items || data.items.length === 0) {
        console.log('더 이상 검색 결과가 없습니다.')
        break
      }

      const videoIds = data.items.map(item => item.id.videoId).join(',')
      
      // 영상 상세 정보 가져오기
      const detailsResponse = await fetch(
        `${API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      )
      const detailsData = await detailsResponse.json()

      if (detailsData.items) {
        for (const item of detailsData.items) {
          const videoId = item.id
          const snippet = item.snippet
          const statistics = item.statistics
          const channelId = snippet.channelId

          // 채널 정보 가져오기
          let channelInfo = null
          let isKoreanContent = false
          
          try {
            const channelResponse = await fetch(
              `${API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
            )
            const channelData = await channelResponse.json()
            if (channelData.items && channelData.items.length > 0) {
              channelInfo = channelData.items[0]
              
              // 대한민국 필터링: country가 KR이거나 한국어 제목인 경우 포함
              const channelCountry = channelInfo.snippet?.country
              const videoTitle = snippet.title || ''
              const videoDescription = snippet.description || ''
              
              if (regionCode === 'KR') {
                // 대한민국 필터링: country가 KR이거나 제목/설명에 한글이 포함된 경우
                const hasKoreanInTitle = containsKorean(videoTitle)
                const hasKoreanInDescription = containsKorean(videoDescription)
                const isKoreanCountry = channelCountry === 'KR'
                
                if (isKoreanCountry || hasKoreanInTitle || hasKoreanInDescription) {
                  isKoreanContent = true
                } else {
                  // country도 KR이 아니고 한글도 없으면 제외
                  continue
                }
              } else {
                // 다른 지역의 경우: country가 선택된 지역과 일치해야 함
                if (channelCountry && channelCountry !== regionCode) {
                  continue
                }
                // country 정보가 없는 경우는 포함 (다른 지역은 완화)
              }
            } else {
              // 채널 정보를 가져올 수 없으면 제목으로만 판단
              if (regionCode === 'KR') {
                const videoTitle = snippet.title || ''
                const videoDescription = snippet.description || ''
                const hasKorean = containsKorean(videoTitle) || containsKorean(videoDescription)
                if (!hasKorean) {
                  continue
                }
                isKoreanContent = true
              } else {
                // 다른 지역이고 채널 정보가 없으면 제외하지 않음 (완화)
              }
            }
          } catch (err) {
            console.warn('채널 정보 가져오기 실패:', err)
            // 채널 정보를 가져올 수 없으면 제목으로만 판단
            if (regionCode === 'KR') {
              const videoTitle = snippet.title || ''
              const videoDescription = snippet.description || ''
              const hasKorean = containsKorean(videoTitle) || containsKorean(videoDescription)
              if (!hasKorean) {
                continue
              }
              isKoreanContent = true
            }
            // 다른 지역이고 채널 정보를 가져올 수 없으면 포함 (완화)
          }

          // 30초 이하 필터링 (contentDetails.duration 사용)
          if (isUnder30Seconds) {
            const duration = parseDuration(item.contentDetails?.duration || 'PT0S')
            if (duration > 30) {
              // 30초 초과는 제외
              continue
            }
          }

          const viewCount = parseInt(statistics.viewCount || 0)
          const subscriberCount = parseInt(channelInfo?.statistics?.subscriberCount || 0)
          // 떡상 지수: (조회수/구독자수)*100
          const viralScore = subscriberCount > 0 ? (viewCount / subscriberCount) * 100 : 0

          allVideos.push({
            videoId: videoId,
            title: snippet.title,
            description: snippet.description,
            thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
            publishedAt: snippet.publishedAt,
            viewCount: viewCount,
            likeCount: parseInt(statistics.likeCount || 0),
            commentCount: parseInt(statistics.commentCount || 0),
            channelId: channelId,
            channelTitle: snippet.channelTitle,
            channelThumbnail: channelInfo?.snippet?.thumbnails?.default?.url || '',
            subscriberCount: subscriberCount,
            viralScore: viralScore
          })
        }
      }

      nextPageToken = data.nextPageToken
      pageCount++

      console.log(`페이지 ${pageCount} 수집 완료: ${allVideos.length}개 영상 수집됨`)

      if (!nextPageToken) {
        console.log('모든 페이지 수집 완료')
        break
      }

      // API 할당량 고려하여 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('검색 중 오류:', error)
      throw error
    }
  }

  console.log(`Deep Search 완료: 총 ${allVideos.length}개 영상 수집`)
  return allVideos.slice(0, MAX_RESULTS)
}

