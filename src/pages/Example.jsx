import { useState, useEffect, useRef } from 'react'

function Example() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('yt_api_key_v3') || '')
  const [keyword, setKeyword] = useState('')
  const [apiOrder, setApiOrder] = useState('relevance')
  const [apiDuration, setApiDuration] = useState('any')
  const [apiDate, setApiDate] = useState('all')
  const [rawData, setRawData] = useState([])
  const [currentSort, setCurrentSort] = useState('viewCount')
  const [isDescending, setIsDescending] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const keywordInputRef = useRef(null)

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('yt_api_key_v3', apiKey)
    }
  }, [apiKey])

  const saveKey = () => {
    const key = keywordInputRef.current?.value.trim() || apiKey.trim()
    if (!key) {
      alert('Key를 입력하세요.')
      return
    }
    localStorage.setItem('yt_api_key_v3', key)
    setApiKey(key)
    showToast('저장되었습니다.')
  }

  const clearKey = () => {
    localStorage.removeItem('yt_api_key_v3')
    setApiKey('')
    if (keywordInputRef.current) {
      keywordInputRef.current.value = ''
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getPublishedAfterRFC3339 = (option) => {
    if (option === 'all') return ''
    const now = new Date()
    switch (option) {
      case '1h': now.setHours(now.getHours() - 1); break
      case '24h': now.setHours(now.getHours() - 24); break
      case '7d': now.setDate(now.getDate() - 7); break
      case '30d': now.setDate(now.getDate() - 30); break
      case '1y': now.setFullYear(now.getFullYear() - 1); break
    }
    return now.toISOString()
  }

  const parseDuration = (d) => {
    const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!m) return 0
    return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0)
  }

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sc = s % 60
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`
      : `${m}:${sc.toString().padStart(2, '0')}`
  }

  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const escapeHtml = (t) => {
    return t ? t.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : ""
  }

  const fetchData = async () => {
    if (!apiKey) {
      alert('API 키가 필요합니다.')
      return
    }
    const searchKeyword = keyword.trim()
    if (!searchKeyword) {
      alert('검색어를 입력해주세요.')
      return
    }

    const publishedAfter = getPublishedAfterRFC3339(apiDate)
    setLoading(true)
    setRawData([])

    try {
      let videoItems = []
      let nextPageToken = ''
      let pagesFetched = 0
      const MAX_PAGES = 4

      while (pagesFetched < MAX_PAGES) {
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchKeyword)}&type=video&maxResults=50&regionCode=KR&key=${apiKey}`
        
        searchUrl += `&order=${apiOrder}`
        if (apiDuration !== 'any') searchUrl += `&videoDuration=${apiDuration}`
        if (publishedAfter) searchUrl += `&publishedAfter=${publishedAfter}`
        if (nextPageToken) searchUrl += `&pageToken=${nextPageToken}`

        const searchRes = await fetch(searchUrl)
        const searchJson = await searchRes.json()
        
        if (!searchJson.items || searchJson.items.length === 0) break
        
        videoItems = videoItems.concat(searchJson.items)
        nextPageToken = searchJson.nextPageToken
        pagesFetched++

        if (!nextPageToken) break
      }

      if (videoItems.length === 0) throw new Error('검색 결과가 없습니다.')

      const allVideoIds = videoItems.map(i => i.id.videoId)
      const videoDetailsMap = {}
      
      for (let i = 0; i < allVideoIds.length; i += 50) {
        const chunk = allVideoIds.slice(i, i + 50).join(',')
        const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk}&key=${apiKey}`
        const vRes = await fetch(vUrl)
        const vJson = await vRes.json()
        if (vJson.items) vJson.items.forEach(v => videoDetailsMap[v.id] = v)
      }

      const channelIds = [...new Set(videoItems.map(i => i.snippet.channelId))]
      const channelMap = {}

      for (let i = 0; i < channelIds.length; i += 50) {
        const chunk = channelIds.slice(i, i + 50).join(',')
        const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${chunk}&key=${apiKey}`
        const cRes = await fetch(cUrl)
        const cJson = await cRes.json()
        if (cJson.items) {
          cJson.items.forEach(c => {
            let subs = parseInt(c.statistics.subscriberCount || 0)
            if (subs === 0) subs = 1
            channelMap[c.id] = subs
          })
        }
      }

      const processedData = videoItems.map(item => {
        const vId = item.id.videoId
        const vDetail = videoDetailsMap[vId]
        if (!vDetail) return null

        const subCount = channelMap[item.snippet.channelId] || 1
        const viewCount = parseInt(vDetail.statistics.viewCount || 0)
        const viralScore = (viewCount / subCount) * 100
        const tags = vDetail.snippet.tags ? vDetail.snippet.tags.join(', ') : ''

        return {
          id: vId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          publishedAt: new Date(item.snippet.publishedAt),
          publishedDate: item.snippet.publishedAt.substring(0, 10),
          thumbnail: vDetail.snippet.thumbnails.high ? vDetail.snippet.thumbnails.high.url : vDetail.snippet.thumbnails.medium.url,
          viewCount: viewCount,
          subCount: subCount,
          viralScore: viralScore,
          durationStr: formatDuration(parseDuration(vDetail.contentDetails.duration)),
          url: `https://www.youtube.com/watch?v=${vId}`,
          tags: tags
        }
      }).filter(i => i !== null)

      setRawData(processedData)
    } catch (e) {
      console.error(e)
      alert('오류: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      fetchData()
    }
  }

  const sortResult = (criteria) => {
    setCurrentSort(criteria)
  }

  const toggleOrder = () => {
    setIsDescending(!isDescending)
  }

  const getViralBadge = (score) => {
    let text = '', className = ''
    if (score < 100) { text = '🏳️ 일반'; className = 'lv-1' }
    else if (score < 500) { text = '🌿 우수'; className = 'lv-2' }
    else if (score < 1000) { text = '💧 떡상'; className = 'lv-3' }
    else if (score < 5000) { text = '🔮 대박'; className = 'lv-4' }
    else if (score < 10000) { text = '🦁 초대박'; className = 'lv-5' }
    else { text = '👑 신의 간택 (100배+)'; className = 'lv-6' }
    return { text, className }
  }

  const copyAiPrompt = (title, channel, duration, multiplier, tags) => {
    const prompt = `나는 유튜브 크리에이터야. 아래 영상을 벤치마킹해서 기획안을 써줘. (GPT/Gemini)\n\n[대상]\n제목: ${title}\n채널: ${channel}\n길이: ${duration}\n성과: 구독자 대비 ${multiplier}배 조회수\n태그: ${tags}\n\n[요청]\n1. 클릭을 부른 심리적 트리거 분석\n2. 내 주제에 맞춘 썸네일/제목 5개 추천\n3. 시청 지속 시간을 위한 대본 구조 설계`
    copyText(prompt, 'AI 기획안이 복사되었습니다!')
  }

  const copyText = (text, message = '복사됨') => {
    const decoded = text.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    navigator.clipboard.writeText(decoded).then(() => {
      showToast(message)
    })
  }

  const sortedData = [...rawData].sort((a, b) => {
    let valA = a[currentSort]
    let valB = b[currentSort]
    
    if (currentSort === 'date') {
      valA = a.publishedAt.getTime()
      valB = b.publishedAt.getTime()
    }

    return isDescending ? valB - valA : valA - valB
  })

  return (
    <div style={{
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      backgroundColor: '#121212',
      color: '#ffffff',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif",
    }}>
      <style>{`
        :root {
          --bg-color: #121212;
          --card-bg: #1e1e1e;
          --panel-bg: #252525;
          --text-main: #ffffff;
          --text-sub: #a0a0a0;
          --accent-color: #3ea6ff;
          --border-color: #333;
          --ai-btn-bg: linear-gradient(135deg, #7c3aed, #a855f7);
          --lv1-color: #424242;
          --lv2-color: #2e7d32;
          --lv3-color: #1565c0;
          --lv4-color: #6a1b9a;
          --lv5-color: #e65100;
          --lv6-bg: linear-gradient(135deg, #d50000, #ff1744, #ff5252);
        }
        .viral-badge {
          text-align: center;
          padding: 8px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 13px;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          margin: 8px 0;
        }
        .lv-1 { background: var(--lv1-color); color: #aaa; border: 1px solid #555; }
        .lv-2 { background: var(--lv2-color); }
        .lv-3 { background: var(--lv3-color); }
        .lv-4 { background: var(--lv4-color); }
        .lv-5 { background: var(--lv5-color); }
        .lv-6 { 
          background: var(--lv6-bg); 
          box-shadow: 0 0 15px rgba(255, 23, 68, 0.6); 
          animation: godMode 2s infinite alternate; 
        }
        @keyframes godMode { 
          0% { box-shadow: 0 0 10px rgba(255, 23, 68, 0.6); transform: scale(1); } 
          100% { box-shadow: 0 0 25px rgba(255, 23, 68, 1); transform: scale(1.03); } 
        }
        .card:hover .thumb-img { transform: scale(1.05); }
      `}</style>

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          background: '#1e1e1e',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 800,
              background: 'linear-gradient(to right, #fff, #bbb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              🔥 YouTube Native + Insight V3.0
            </h1>
            <span style={{ fontSize: '12px', color: '#888' }}>API Level Filtering | Zero Data Loss</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              ref={keywordInputRef}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="YouTube API Key 입력"
              style={{
                width: '200px',
                background: '#2a2a2a',
                border: '1px solid #333',
                color: '#fff',
                padding: '10px 15px',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              onClick={saveKey}
              style={{
                background: '#444',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Key 저장
            </button>
            <button
              onClick={clearKey}
              style={{
                background: '#444',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              초기화
            </button>
          </div>
        </header>

        {/* Filter Panel */}
        <div style={{
          background: '#1e1e1e',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '25px',
          border: '1px solid #333',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#3ea6ff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                📅 업로드 날짜 (API)
              </span>
              <select
                value={apiDate}
                onChange={(e) => setApiDate(e.target.value)}
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              >
                <option value="all">전체 (All time)</option>
                <option value="1h">지난 1시간</option>
                <option value="24h">오늘 (24시간)</option>
                <option value="7d">이번 주 (7일)</option>
                <option value="30d">이번 달 (30일)</option>
                <option value="1y">올해 (1년)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#3ea6ff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                ⏱️ 영상 길이 (API)
              </span>
              <select
                value={apiDuration}
                onChange={(e) => setApiDuration(e.target.value)}
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              >
                <option value="any">전체 길이</option>
                <option value="short">4분 미만 (Short)</option>
                <option value="medium">4분 ~ 20분 (Medium)</option>
                <option value="long">20분 초과 (Long)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#3ea6ff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                🎯 검색 정렬 기준 (API)
              </span>
              <select
                value={apiOrder}
                onChange={(e) => setApiOrder(e.target.value)}
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #3ea6ff',
                  color: '#fff',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              >
                <option value="relevance">관련성 (기본)</option>
                <option value="viewCount">👁️ 조회수순 (인기)</option>
                <option value="date">📅 최신순 (Date)</option>
                <option value="rating">⭐ 평점순</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleEnter}
              placeholder="메인 키워드 (예: 사연 드라마, 노후준비)"
              style={{
                flex: 1,
                background: '#2a2a2a',
                border: '1px solid #333',
                color: '#fff',
                padding: '10px 15px',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              onClick={fetchData}
              style={{
                background: '#3ea6ff',
                color: '#000',
                border: 'none',
                padding: '10px 30px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              🚀 Deep Search (200개)
            </button>
          </div>
        </div>

        {/* Sort Bar */}
        <div style={{
          background: '#252525',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #333',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>결과 재정렬:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['viewCount', 'subCount', 'viralScore', 'date'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => sortResult(sort)}
                  style={{
                    background: currentSort === sort ? '#3ea6ff' : '#333',
                    color: currentSort === sort ? '#000' : '#aaa',
                    border: `1px solid ${currentSort === sort ? '#3ea6ff' : '#444'}`,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: currentSort === sort ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  {sort === 'viewCount' && '조회수순'}
                  {sort === 'subCount' && '구독자순'}
                  {sort === 'viralScore' && '🔥 떡상지수순'}
                  {sort === 'date' && '최신순'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#888', marginRight: '15px' }}>
              검색 결과: {rawData.length}개
            </span>
            <span
              onClick={toggleOrder}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '18px',
                padding: '0 10px',
              }}
            >
              {isDescending ? '⬇️' : '⬆️'}
            </span>
          </div>
        </div>

        {/* Results */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '15px',
        }}>
          {sortedData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px',
              color: '#555',
              gridColumn: '1/-1',
            }}>
              <h3>YouTube Native Filtering System</h3>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                상단의 필터를 설정하면 <b>API 요청 단계</b>에서 데이터를 걸러옵니다.<br />
                더 이상 조회수 높은 영상이나 최신 영상이 누락되지 않습니다.
              </p>
            </div>
          ) : (
            sortedData.map((item) => {
              const badge = getViralBadge(item.viralScore)
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#1e1e1e',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        transition: '0.3s',
                      }}
                      className="thumb-img"
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.85)',
                      color: '#fff',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {item.durationStr}
                    </span>
                  </div>
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: '#fff',
                      marginBottom: '6px',
                      height: '44px',
                    }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📺 {item.channelTitle} • {item.publishedDate}
                    </div>
                    <div className={`viral-badge ${badge.className}`}>
                      {badge.text}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: '#111',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      marginTop: '5px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>조회수</span>
                        <span style={{ fontWeight: 700, color: '#eee' }}>{formatNum(item.viewCount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>구독자</span>
                        <span style={{ fontWeight: 700, color: '#eee' }}>{formatNum(item.subCount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1/-1' }}>
                        <span>기여도</span>
                        <span style={{ fontWeight: 700, color: '#3ea6ff' }}>
                          {item.viralScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
                        </span>
                      </div>
                    </div>
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      gap: '8px',
                      paddingTop: '15px',
                      borderTop: '1px solid #333',
                    }}>
                      <button
                        onClick={() => copyText(item.title)}
                        style={{
                          flex: '0.8',
                          fontSize: '12px',
                          background: '#333',
                          color: '#ccc',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        제목 복사
                      </button>
                      <button
                        onClick={() => copyAiPrompt(item.title, item.channelTitle, item.durationStr, (item.viralScore / 100).toFixed(1), item.tags)}
                        style={{
                          flex: '1.2',
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          color: 'white',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        🤖 AI 기획
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid #333',
            borderTop: '5px solid #3ea6ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px',
          }} />
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>DEEP SEARCHING...</div>
          <div style={{ color: '#bbb', fontSize: '14px', marginTop: '10px', textAlign: 'center' }}>
            유튜브 서버에서 직접 필터링된 데이터를<br />
            최대 200개까지 수집 중입니다.
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffffff',
          color: '#000',
          padding: '12px 24px',
          borderRadius: '30px',
          fontWeight: 600,
          boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
          zIndex: 10000,
          transition: '0.3s',
        }}>
          ✅ {toast.message}
        </div>
      )}
    </div>
  )
}

export default Example
