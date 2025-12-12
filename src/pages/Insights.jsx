import { useState, useEffect, useRef } from 'react'
import { deepSearchVideos } from '../services/youtubeApi'
import { useRegion } from '../contexts/RegionContext'

// 달력 컴포넌트
function DatePicker({ value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = new Date(value)
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const calendarRef = useRef(null)

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토']
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const formatDisplayDate = (dateString) => {
    if (!dateString) return placeholder || '날짜 선택'
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // 이전 달의 마지막 날들
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }
    
    // 현재 달의 날들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // 다음 달의 첫 날들 (캘린더를 채우기 위해)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const handleDateClick = (date) => {
    onChange(formatDate(date))
    setIsOpen(false)
  }

  const handleTodayClick = () => {
    const today = new Date()
    onChange(formatDate(today))
    setIsOpen(false)
  }

  const handleDeleteClick = () => {
    onChange('')
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const selectedDate = value ? new Date(value) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={calendarRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#0f0f0f',
          border: '2px solid #2d3748',
          borderRadius: '8px',
          color: '#e0e0e0',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{formatDisplayDate(value)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          backgroundColor: '#1a2332',
          border: '2px solid #2d3748',
          borderRadius: '12px',
          padding: '20px',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          minWidth: '320px',
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <button
              onClick={handlePrevMonth}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
            }}>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </div>
            <button
              onClick={handleNextMonth}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px',
          }}>
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: index === 0 ? '#ff6b6b' : index === 6 ? '#4ecdc4' : '#b0b0b0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
          }}>
            {getDaysInMonth(currentMonth).map((dayObj, index) => {
              const dayDate = dayObj.date
              const dayStr = formatDate(dayDate)
              const isSelected = selectedDate && formatDate(selectedDate) === dayStr
              const isToday = formatDate(today) === dayStr
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(dayDate)}
                  style={{
                    padding: '10px',
                    background: isSelected 
                      ? '#3182ce' 
                      : isToday 
                        ? '#2d3748' 
                        : 'transparent',
                    border: isSelected 
                      ? '2px solid #3182ce' 
                      : isToday 
                        ? '2px solid #4ecdc4' 
                        : '2px solid transparent',
                    borderRadius: '6px',
                    color: dayObj.isCurrentMonth 
                      ? (isSelected ? '#ffffff' : '#e0e0e0')
                      : '#4a5568',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: isSelected || isToday ? '600' : '400',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = '#2d3748'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {dayDate.getDate()}
                </button>
              )
            })}
          </div>

          {/* 하단 버튼 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px',
          }}>
            <button
              onClick={handleDeleteClick}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4a5568'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2d3748'}
            >
              삭제
            </button>
            <button
              onClick={handleTodayClick}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#3182ce',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2c5aa0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3182ce'}
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Insights() {
  const { selectedRegion } = useRegion()
  const [searchQuery, setSearchQuery] = useState('')
  const [order, setOrder] = useState('relevance')
  const [videoDuration, setVideoDuration] = useState('any')
  const [publishedAfter, setPublishedAfter] = useState('')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('viralScore')

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setVideos([])

    try {
      const results = await deepSearchVideos(
        searchQuery,
        order,
        videoDuration,
        publishedAfter || null,
        selectedRegion || 'KR'
      )
      
      // 검색 결과를 정렬 기준에 따라 정렬
      const sorted = [...results]
      switch (sortBy) {
        case 'viralScore':
          sorted.sort((a, b) => b.viralScore - a.viralScore)
          break
        case 'viewCount':
          sorted.sort((a, b) => b.viewCount - a.viewCount)
          break
        case 'subscriberCount':
          sorted.sort((a, b) => b.subscriberCount - a.subscriberCount)
          break
        default:
          break
      }
      
      setVideos(sorted)
      if (results.length === 0) {
        setError('검색 결과가 없습니다.')
      }
    } catch (err) {
      setError(err.message || '검색 중 오류가 발생했습니다.')
      console.error('검색 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // sortBy가 변경될 때마다 정렬
  useEffect(() => {
    if (videos.length > 0) {
      const sorted = [...videos]
      switch (sortBy) {
        case 'viralScore':
          sorted.sort((a, b) => b.viralScore - a.viralScore)
          break
        case 'viewCount':
          sorted.sort((a, b) => b.viewCount - a.viewCount)
          break
        case 'subscriberCount':
          sorted.sort((a, b) => b.subscriberCount - a.subscriberCount)
          break
        default:
          break
      }
      setVideos(sorted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy])

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const copyAnalysisPrompt = (video) => {
    const prompt = `다음 YouTube 영상을 분석해주세요:

영상 제목: ${video.title}
채널명: ${video.channelTitle}
조회수: ${formatNumber(video.viewCount)}
구독자 수: ${formatNumber(video.subscriberCount)}
떡상 지수 (Viral Score): ${video.viralScore.toFixed(2)}%
좋아요 수: ${formatNumber(video.likeCount)}
댓글 수: ${formatNumber(video.commentCount)}
게시일: ${new Date(video.publishedAt).toLocaleDateString('ko-KR')}

영상 URL: https://www.youtube.com/watch?v=${video.videoId}

이 영상의 성공 요인, 콘텐츠 전략, 타겟 오디언스, 개선점 등을 분석해주세요.`

    navigator.clipboard.writeText(prompt).then(() => {
      // 성공 메시지 표시 (간단한 alert로 대체 가능)
      alert('분석 프롬프트가 클립보드에 복사되었습니다!')
    }).catch(err => {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다. 수동으로 복사해주세요.\n\n' + prompt)
    })
  }

  // 통계 계산
  const totalVideos = videos.length
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const avgViralScore = videos.length > 0 
    ? videos.reduce((sum, v) => sum + v.viralScore, 0) / videos.length 
    : 0

  return (
    <div style={{
      flex: 1,
      padding: '24px',
      overflowY: 'auto',
      color: '#ffffff',
    }}>
      <h1 style={{ marginBottom: '30px', fontSize: '2em' }}>YouTube 영상 분석</h1>

      {/* 검색 필터 섹션 */}
      <div style={{
        backgroundColor: '#1a2332',
        padding: '25px',
        borderRadius: '10px',
        marginBottom: '30px',
        border: '2px solid #2d3748',
      }}>
        <h2 style={{ marginBottom: '20px', color: '#4ecdc4', fontSize: '1.5em' }}>검색 필터</h2>
        <form onSubmit={handleSearch}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#b0b0b0',
                fontWeight: '500',
                fontSize: '0.9em',
              }}>
                검색어
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #2d3748',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#b0b0b0',
                fontWeight: '500',
                fontSize: '0.9em',
              }}>
                정렬 순서
              </label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #2d3748',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                }}
              >
                <option value="relevance">관련성</option>
                <option value="date">날짜순</option>
                <option value="rating">평점순</option>
                <option value="title">제목순</option>
                <option value="viewCount">조회수순</option>
                <option value="videoCount">동영상 수순</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#b0b0b0',
                fontWeight: '500',
                fontSize: '0.9em',
              }}>
                영상 길이
              </label>
              <select
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #2d3748',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                }}
              >
                <option value="any">전체</option>
                <option value="short30">30초 이하</option>
                <option value="short">짧은 영상 (4분 이하)</option>
                <option value="medium">중간 영상 (4-20분)</option>
                <option value="long">긴 영상 (20분 이상)</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#b0b0b0',
                fontWeight: '500',
                fontSize: '0.9em',
              }}>
                게시일 (이후)
              </label>
              <DatePicker
                value={publishedAfter}
                onChange={setPublishedAfter}
                placeholder="날짜 선택"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#4a5568' : 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
              background: loading ? '#4a5568' : '#ff6b6b',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 5px 20px rgba(255, 107, 107, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {loading ? '검색 중... (최대 200개 수집)' : 'Deep Search 시작 (최대 200개 수집)'}
          </button>
        </form>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div style={{
          backgroundColor: '#2a1a1a',
          border: '2px solid #ff6b6b',
          color: '#ff6b6b',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 통계 섹션 */}
      {videos.length > 0 && (
        <>
          <div style={{
            backgroundColor: '#1a2332',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '20px',
            border: '2px solid #2d3748',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2em', fontWeight: '700', color: '#4ecdc4' }}>
                {totalVideos}
              </div>
              <div style={{ color: '#b0b0b0', fontSize: '0.9em', marginTop: '5px' }}>
                수집된 영상
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2em', fontWeight: '700', color: '#4ecdc4' }}>
                {formatNumber(totalViews)}
              </div>
              <div style={{ color: '#b0b0b0', fontSize: '0.9em', marginTop: '5px' }}>
                총 조회수
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2em', fontWeight: '700', color: '#4ecdc4' }}>
                {avgViralScore.toFixed(2)}%
              </div>
              <div style={{ color: '#b0b0b0', fontSize: '0.9em', marginTop: '5px' }}>
                평균 떡상 지수
              </div>
            </div>
          </div>

          {/* 정렬 컨트롤 */}
          <div style={{
            backgroundColor: '#1a2332',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            border: '2px solid #2d3748',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ color: '#b0b0b0', fontWeight: '500' }}>정렬 기준:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #2d3748',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="viralScore">떡상 지수순</option>
                <option value="viewCount">조회수순</option>
                <option value="subscriberCount">구독자순</option>
              </select>
            </div>
          </div>

          {/* 영상 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {videos.map((video) => {
              const viralScoreClass = video.viralScore >= 10000 ? 'viral-score-high' : 'viral-score-normal'
              const viralScoreText = video.viralScore.toFixed(2) + '%'

              return (
                <div
                  key={video.videoId}
                  style={{
                    backgroundColor: '#1a2332',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #2d3748',
                    transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(78, 205, 196, 0.2)'
                    e.currentTarget.style.borderColor = '#4ecdc4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#2d3748'
                  }}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      backgroundColor: '#0f0f0f',
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'200\'%3E%3Crect fill=\'%230f0f0f\' width=\'400\' height=\'200\'/%3E%3Ctext fill=\'%23333\' font-family=\'sans-serif\' font-size=\'20\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3E썸네일 없음%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor: '#0f0f0f',
                      borderRadius: '6px',
                    }}>
                      <img
                        src={video.channelThumbnail || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'30\' height=\'30\'%3E%3Ccircle cx=\'15\' cy=\'15\' r=\'15\' fill=\'%23333\'/%3E%3C/svg%3E'}
                        alt={video.channelTitle}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'30\' height=\'30\'%3E%3Ccircle cx=\'15\' cy=\'15\' r=\'15\' fill=\'%23333\'/%3E%3C/svg%3E'
                        }}
                      />
                      <span style={{ fontSize: '0.9em', color: '#b0b0b0' }}>
                        {video.channelTitle}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '1.1em',
                      fontWeight: '600',
                      marginBottom: '15px',
                      color: '#e0e0e0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {video.title}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                      marginBottom: '15px',
                    }}>
                      <div style={{
                        backgroundColor: '#0f0f0f',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.8em', color: '#b0b0b0', marginBottom: '5px' }}>
                          조회수
                        </div>
                        <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#4ecdc4' }}>
                          {formatNumber(video.viewCount)}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#0f0f0f',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.8em', color: '#b0b0b0', marginBottom: '5px' }}>
                          구독자
                        </div>
                        <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#4ecdc4' }}>
                          {formatNumber(video.subscriberCount)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      margin: '15px 0',
                      padding: '12px',
                      backgroundColor: '#0f0f0f',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.8em', color: '#b0b0b0', marginBottom: '5px' }}>
                        떡상 지수 (Viral Score)
                      </div>
                      <div style={{
                        fontSize: '1.3em',
                        fontWeight: '700',
                        color: video.viralScore >= 10000 ? '#ff6b6b' : '#4ecdc4',
                        animation: video.viralScore >= 10000 ? 'pulse 2s infinite' : 'none',
                      }}>
                        {viralScoreText}
                        {video.viralScore >= 10000 && ' 🔥'}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '15px',
                    }}>
                      <button
                        onClick={() => copyAnalysisPrompt(video)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#4ecdc4',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 5px 15px rgba(78, 205, 196, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        AI 기획
                      </button>
                      <button
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#2d3748',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#e0e0e0',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.backgroundColor = '#4a5568'
                          e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.backgroundColor = '#2d3748'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        YouTube 보기
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#4ecdc4',
          fontSize: '1.2em',
        }}>
          영상 데이터를 수집하는 중...
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}

export default Insights
