import { createContext, useContext, useState } from 'react'

const RegionContext = createContext()

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegion] = useState('KR') // 기본값: 대한민국
  const [reverseOrder, setReverseOrder] = useState(false) // 기본값: 정순
  const [videoType, setVideoType] = useState('all') // 기본값: 전체 (all, longform, shorts)
  const [period, setPeriod] = useState('daily') // 기본값: 일별 (daily, weekly, monthly)

  return (
    <RegionContext.Provider value={{ 
      selectedRegion, 
      setSelectedRegion,
      reverseOrder,
      setReverseOrder,
      videoType,
      setVideoType,
      period,
      setPeriod
    }}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  const context = useContext(RegionContext)
  if (!context) {
    throw new Error('useRegion must be used within RegionProvider')
  }
  return context
}

