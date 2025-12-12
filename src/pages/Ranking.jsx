import { useState, useEffect } from 'react'
import { fetchYouTubeRanking } from '../services/youtubeApi'
import { useRegion } from '../contexts/RegionContext'

function Ranking() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { selectedRegion, reverseOrder, videoType, period } = useRegion()

  useEffect(() => {
    loadRankings()
  }, [selectedRegion, videoType, period])

  const loadRankings = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('랭킹 데이터 로딩 시작...', { region: selectedRegion, videoType, period })
      const data = await fetchYouTubeRanking(selectedRegion, videoType, period)
      console.log('랭킹 데이터 로딩 완료:', data.length, '개')
      setRankings(data)
    } catch (err) {
      const errorMessage = err.message || '랭킹을 불러오는데 실패했습니다.'
      setError(errorMessage)
      console.error('랭킹 로딩 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRankings = rankings
    .filter(item => 
      item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (reverseOrder) {
        return b.rank - a.rank  // 역순: 높은 순위부터
      }
      return a.rank - b.rank  // 기본: 1위부터 (오름차순)
    })

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getRankChangeIcon = (change) => {
    if (change > 0) return '^'
    if (change < 0) return 'v'
    return '→'
  }

  const getRankChangeColor = (change) => {
    if (change > 0) return '#48bb78'
    if (change < 0) return '#f56565'
    return '#a0aec0'
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: '#a0aec0',
        }}>
          로딩 중...
        </div>
      </div>
    )
  }

  if (error && rankings.length === 0) {
    return (
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: '#a0aec0',
        }}>
          <p>⚠️ {error}</p>
          <p style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>
            브라우저 콘솔에서 자세한 오류 정보를 확인할 수 있습니다.
          </p>
          <button 
            onClick={loadRankings}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: '#3182ce',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2c5aa0'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3182ce'
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      padding: '24px',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1a2332',
              border: '1px solid #2d3748',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{
          flex: 1,
          maxWidth: '400px',
        }}>
          <input
            type="text"
            placeholder="채널명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#1a2332',
              border: '1px solid #2d3748',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            onFocus={(e) => {
              e.target.style.outline = 'none'
              e.target.style.borderColor = '#3182ce'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#2d3748'
            }}
          />
        </div>
      </div>

      <div style={{
        backgroundColor: '#1a2332',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 80px 60px 2fr 2fr 150px 120px',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#2d3748',
          fontWeight: '600',
          color: '#a0aec0',
          fontSize: '14px',
          borderBottom: '1px solid #4a5568',
        }}>
          <div style={{ textAlign: 'center' }}>순위</div>
          <div>변화</div>
          <div style={{ textAlign: 'center' }}>프로필</div>
          <div>채널명</div>
          <div>채널 ID</div>
          <div style={{ textAlign: 'right' }}>기간 조회수</div>
          <div style={{ textAlign: 'right' }}>변화율</div>
        </div>

        {filteredRankings.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#a0aec0',
          }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredRankings.map((item, index) => (
            <div 
              key={item.channelId || index} 
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 80px 60px 2fr 2fr 150px 120px',
                gap: '16px',
                padding: '16px',
                borderBottom: '1px solid #2d3748',
                transition: 'background-color 0.2s',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d3748'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                fontWeight: '600',
                fontSize: '16px',
                color: '#ffffff',
                textAlign: 'center',
              }}>
                {item.rank}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
              }}>
                {item.rankChange !== undefined && (
                  <span style={{ 
                    color: getRankChangeColor(item.rankChange),
                    fontWeight: '600',
                  }}>
                    {getRankChangeIcon(item.rankChange)} {Math.abs(item.rankChange)}
                  </span>
                )}
                {item.isNew && <span style={{ color: '#f56565', fontSize: '16px' }}>♨</span>}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
              }}>
                <a 
                  href={`https://www.youtube.com/channel/${item.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <img 
                    src={item.thumbnail || '/default-avatar.png'} 
                    alt={item.channelName}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40'
                    }}
                  />
                </a>
              </div>
              <div style={{
                fontWeight: '500',
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                <a 
                  href={`https://www.youtube.com/channel/${item.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ffffff',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#3182ce'
                    e.target.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#ffffff'
                    e.target.style.textDecoration = 'none'
                  }}
                >
                  {item.channelName}
                </a>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#a0aec0',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.channelId}
              </div>
              <div style={{
                fontWeight: '600',
                color: '#ffffff',
                textAlign: 'right',
                fontSize: '14px',
              }}>
                {formatNumber(item.viewCount || 0)}
              </div>
              <div style={{
                textAlign: 'right',
              }}>
                {item.percentageChange !== undefined && (
                  <span style={{ 
                    color: getRankChangeColor(item.percentageChange),
                    fontWeight: '600',
                    fontSize: '14px',
                  }}>
                    {getRankChangeIcon(item.percentageChange)} {Math.abs(item.percentageChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Ranking
