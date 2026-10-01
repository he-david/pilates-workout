import { Route, Routes } from 'react-router'
import { AppUpdateBanner } from './screens/AppUpdateBanner'
import { ExerciseScreen } from './screens/ExerciseScreen'
import { FinishScreen } from './screens/FinishScreen'
import { LogScreen } from './screens/LogScreen'
import { PlayerScreen } from './screens/PlayerScreen'
import { ProgramScreen } from './screens/ProgramScreen'
import { SessionScreen } from './screens/SessionScreen'
import { TabLayout } from './screens/TabLayout'
import { TodayScreen } from './screens/TodayScreen'

export function App() {
  return (
    <>
      <AppUpdateBanner />
      <Routes>
        <Route element={<TabLayout />}>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/program" element={<ProgramScreen />} />
          <Route path="/log" element={<LogScreen />} />
        </Route>
        <Route path="/session/:id" element={<SessionScreen />} />
        <Route path="/exercise/:id" element={<ExerciseScreen />} />
        <Route path="/player/:id" element={<PlayerScreen />} />
        <Route path="/finish/:id" element={<FinishScreen />} />
      </Routes>
    </>
  )
}
