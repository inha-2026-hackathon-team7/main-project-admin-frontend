import { useAdmin } from './state/AdminContext.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toasts from './components/Toasts.jsx';
import FormModal from './components/FormModal.jsx';
import AlertModal from './components/AlertModal.jsx';
import QrModal from './components/QrModal.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Regions from './screens/Regions.jsx';
import Places from './screens/Places.jsx';
import CourseList from './screens/CourseList.jsx';
import CourseDetail from './screens/CourseDetail.jsx';
import Rewards from './screens/Rewards.jsx';
import Review from './screens/Review.jsx';
import Login from './screens/Login.jsx';
import Register from './screens/Register.jsx';

export default function App() {
  const { state, reloadAll } = useAdmin();

  if (state.auth === 'login') {
    return (
      <>
        <Login />
        <Toasts />
      </>
    );
  }
  if (state.auth === 'register') {
    return (
      <>
        <Register />
        <Toasts />
      </>
    );
  }

  if (state.bootError && state.regions.length === 0 && state.courses.length === 0) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--color-bg)',
            padding: 24
          }}
        >
          <div className="card blueprint" style={{ maxWidth: 440, padding: 24, gap: 12, textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>데이터를 불러오지 못했습니다</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)' }}>{state.bootError}</p>
            <button className="btn btn-primary" onClick={reloadAll}>
              다시 시도
            </button>
          </div>
        </div>
        <Toasts />
      </>
    );
  }

  const screen = state.screen;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        fontSize: 15
      }}
    >
      <Header />

      <div style={{ display: 'grid', gridTemplateColumns: '228px minmax(0,1fr)', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <main style={{ overflowY: 'auto', padding: '26px 28px 60px', minWidth: 0 }}>
          {screen === 'dashboard' && <Dashboard />}
          {screen === 'regions' && <Regions />}
          {screen === 'places' && <Places />}
          {screen === 'courses' && (state.openCourseId ? <CourseDetail /> : <CourseList />)}
          {screen === 'rewards' && <Rewards />}
          {screen === 'review' && <Review />}
        </main>
      </div>

      {state.modal === 'form' && <FormModal />}
      {state.modal === 'alert' && <AlertModal />}
      {state.modal === 'qr' && <QrModal />}
      <Toasts />
    </div>
  );
}
