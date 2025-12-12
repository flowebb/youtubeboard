import { Link, useLocation } from 'react-router-dom'
import { useRegion } from '../contexts/RegionContext'

function Layout({ children }) {
  const location = useLocation()

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0f1419',
      color: '#ffffff',
    }}>
      <Sidebar currentPath={location.pathname} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f1419',
      }}>
        <Header />
        {children}
      </div>
    </div>
  )
}

function Sidebar({ currentPath }) {
  return (
    <div style={{
      width: '200px',
      backgroundColor: '#1a2332',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 0',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 16px',
      }}>
        <Link 
          to="/ranking" 
          style={{
            padding: '12px 16px',
            color: currentPath === '/ranking' ? '#ffffff' : '#a0aec0',
            textDecoration: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: currentPath === '/ranking' ? '#3182ce' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (currentPath !== '/ranking') {
              e.target.style.backgroundColor = '#2d3748'
              e.target.style.color = '#ffffff'
            }
          }}
          onMouseLeave={(e) => {
            if (currentPath !== '/ranking') {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#a0aec0'
            }
          }}
        >
          랭킹
        </Link>
        <Link 
          to="/insights" 
          style={{
            padding: '12px 16px',
            color: currentPath === '/insights' ? '#ffffff' : '#a0aec0',
            textDecoration: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: currentPath === '/insights' ? '#3182ce' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (currentPath !== '/insights') {
              e.target.style.backgroundColor = '#2d3748'
              e.target.style.color = '#ffffff'
            }
          }}
          onMouseLeave={(e) => {
            if (currentPath !== '/insights') {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#a0aec0'
            }
          }}
        >
          인사이트
        </Link>
        <Link 
          to="/example" 
          style={{
            padding: '12px 16px',
            color: currentPath === '/example' ? '#ffffff' : '#a0aec0',
            textDecoration: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: currentPath === '/example' ? '#3182ce' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (currentPath !== '/example') {
              e.target.style.backgroundColor = '#2d3748'
              e.target.style.color = '#ffffff'
            }
          }}
          onMouseLeave={(e) => {
            if (currentPath !== '/example') {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#a0aec0'
            }
          }}
        >
          예시
        </Link>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 16px',
        borderTop: '1px solid #2d3748',
        paddingTop: '16px',
      }}>
        <div style={{
          padding: '12px 16px',
          color: '#a0aec0',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2d3748'
          e.target.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent'
          e.target.style.color = '#a0aec0'
        }}
        >
          어드민
        </div>
        <div style={{
          padding: '12px 16px',
          color: '#a0aec0',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2d3748'
          e.target.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent'
          e.target.style.color = '#a0aec0'
        }}
        >
          로그아웃
        </div>
      </div>
    </div>
  )
}

function Header() {
  const { selectedRegion, setSelectedRegion, reverseOrder, setReverseOrder, videoType, setVideoType, period, setPeriod } = useRegion()
  
  const regionOptions = [
    { code: 'KR', name: '대한민국' },
    { code: 'US', name: '미국' },
    { code: 'JP', name: '일본' },
  ]
  
  const videoTypeOptions = [
    { value: 'all', label: '전체' },
    { value: 'longform', label: '롱폼' },
    { value: 'shorts', label: '숏츠' },
  ]
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#1a2332',
      borderBottom: '1px solid #2d3748',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px',
          fontWeight: '600',
          color: '#ffffff',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21V3H3ZM5 5H19V19H5V5ZM7 7V17H9V7H7ZM11 7V17H13V7H11ZM15 7V17H17V7H15Z" fill="currentColor"/>
          </svg>
          <span>LineBoard</span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <button 
            onClick={() => setPeriod('daily')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'daily' ? '#3182ce' : 'transparent',
              border: period === 'daily' ? '1px solid #3182ce' : '1px solid #2d3748',
              color: period === 'daily' ? '#ffffff' : '#a0aec0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (period !== 'daily') {
                e.target.style.backgroundColor = '#2d3748'
                e.target.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (period !== 'daily') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#a0aec0'
              }
            }}
          >일별</button>
          <button 
            onClick={() => setPeriod('weekly')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'weekly' ? '#3182ce' : 'transparent',
              border: period === 'weekly' ? '1px solid #3182ce' : '1px solid #2d3748',
              color: period === 'weekly' ? '#ffffff' : '#a0aec0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (period !== 'weekly') {
                e.target.style.backgroundColor = '#2d3748'
                e.target.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (period !== 'weekly') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#a0aec0'
              }
            }}
          >주별</button>
          <button 
            onClick={() => setPeriod('monthly')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'monthly' ? '#3182ce' : 'transparent',
              border: period === 'monthly' ? '1px solid #3182ce' : '1px solid #2d3748',
              color: period === 'monthly' ? '#ffffff' : '#a0aec0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (period !== 'monthly') {
                e.target.style.backgroundColor = '#2d3748'
                e.target.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (period !== 'monthly') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#a0aec0'
              }
            }}
          >월별</button>
        </div>
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1a2332',
            border: '1px solid #2d3748',
            color: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {regionOptions.map(option => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <button style={{
          padding: '8px 16px',
          backgroundColor: '#1a2332',
          border: '1px solid #2d3748',
          color: '#ffffff',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2d3748'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#1a2332'
        }}
        >신규진입</button>
        <select 
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1a2332',
            border: '1px solid #2d3748',
            color: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {videoTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setReverseOrder(!reverseOrder)}
          style={{
            padding: '8px 16px',
            backgroundColor: reverseOrder ? '#3182ce' : '#1a2332',
            border: reverseOrder ? '1px solid #3182ce' : '1px solid #2d3748',
            color: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!reverseOrder) {
              e.target.style.backgroundColor = '#2d3748'
            }
          }}
          onMouseLeave={(e) => {
            if (!reverseOrder) {
              e.target.style.backgroundColor = '#1a2332'
            }
          }}
        >
          {reverseOrder ? '↑↓ 정순' : '↓↑ 역순'}
        </button>
      </div>
    </div>
  )
}

export default Layout
