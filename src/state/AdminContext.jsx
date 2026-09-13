import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { num, statusLabel } from '../lib/format.js';
import { setToken, setUnauthorizedHandler } from '../lib/apiClient.js';
import { loadPersistedSession, savePersistedSession, clearPersistedSession } from '../lib/session.js';
import { parseAppPath, pathForScreen } from '../lib/routes.js';
import { authApi, regionsApi, placesApi, coursesApi, rewardsApi } from '../api/endpoints.js';
import {
  regionFromApi,
  regionToApi,
  placeFromApi,
  placeCreateToApi,
  placeUpdateToApi,
  rewardFromApi,
  rewardCreateToApi,
  rewardUpdateToApi,
  courseListItemFromApi,
  courseDetailFromApi,
  courseStatsFromApi,
  courseCreateToApi,
  coursePatchToApi,
  coursePlacesToApi,
  pendingItemFromApi,
  loginToApi,
  registerToApi,
  initialsOf
} from '../api/mappers.js';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

function createInitialState() {
  const persisted = loadPersistedSession();
  if (persisted) setToken(persisted.token);

  return {
    // screen / openCourseId 는 URL 에서 파생되므로 여기 저장하지 않음 (AdminProvider 참고)
    auth: persisted ? 'app' : 'login', // 'app' | 'login' | 'register'
    menuOpen: false,
    toasts: [],

    bootLoading: false,
    bootError: null,

    regions: [],
    places: [],
    courses: [], // CourseListItem 목록 — places 상세는 courseDetails 에 별도 캐시
    courseDetails: {}, // id -> courseDetailFromApi 결과 (null 이면 로딩 중)
    courseStats: {}, // id -> courseStatsFromApi 결과 (null 이면 로딩 중)
    rewards: [],
    pending: [],

    regionFilter: 'all',
    placeSearch: '',
    selectedPlaceId: null,

    courseType: 'all',
    courseStatus: 'all',
    draftPlaces: null,
    poolSearch: '',
    dirty: false,

    dashCourseId: null,

    modal: null, // 'form' | 'alert' | 'qr'
    form: {},
    alert: null,
    qrId: null,

    loginForm: { email: '', password: '', error: '', loading: false },
    regForm: {
      organization_name: '',
      organization_type: 'government',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      error: '',
      loading: false
    },

    session: persisted ? persisted.session : null // { org_name, admin_name, admin_email, role, initials }
  };
}

export function AdminProvider({ children }) {
  const [rawState, setState] = useState(createInitialState);
  const navigate = useNavigate();
  const location = useLocation();
  const dragFrom = useRef(null);
  const toastSeq = useRef(1000);

  // screen / openCourseId 는 URL 에서 파생 — 화면 컴포넌트는 그대로 state.screen / state.openCourseId 를 읽습니다.
  const parsedPath = rawState.auth === 'app' ? parseAppPath(location.pathname) : null;
  const state = {
    ...rawState,
    screen: parsedPath ? parsedPath.screen : 'dashboard',
    openCourseId: parsedPath ? parsedPath.openCourseId : null
  };

  /** setState(partial) 또는 setState(prev => partial) — 클래스형 setState 와 같은 병합 동작 */
  const patch = useCallback((next) => {
    setState((s) => ({ ...s, ...(typeof next === 'function' ? next(s) : next) }));
  }, []);

  const toast = useCallback((kind, title, detail) => {
    const id = ++toastSeq.current;
    setState((s) => ({ ...s, toasts: [...s.toasts, { id, kind, title, detail }] }));
    setTimeout(() => setState((x) => ({ ...x, toasts: x.toasts.filter((t) => t.id !== id) })), 5200);
  }, []);

  const loadAll = useCallback(async () => {
    setState((s) => ({ ...s, bootLoading: true, bootError: null }));
    try {
      const [regionsRes, placesRes, rewardsRes, coursesRes, pendingRes] = await Promise.all([
        regionsApi.list(),
        placesApi.list(),
        rewardsApi.list(),
        coursesApi.list(),
        coursesApi.pending('USER')
      ]);
      const places = placesRes.map(placeFromApi);
      const courses = coursesRes.map(courseListItemFromApi);

      // Place 목록 화면의 삭제 차단 힌트가 모든 행에서 정확히 보이도록 참조 코스 정보를 한 번에 채워둔다.
      Promise.all(places.map((p) => placesApi.detail(p.id).then(placeFromApi).catch(() => null)))
        .then((details) => {
          setState((s) => ({
            ...s,
            places: s.places.map((p) => {
              const d = details.find((x) => x && x.id === p.id);
              return d ? { ...p, referencing_courses: d.referencing_courses || [] } : p;
            })
          }));
        })
        .catch(() => {});

      setState((s) => ({
        ...s,
        regions: regionsRes.map(regionFromApi),
        places,
        rewards: rewardsRes.map(rewardFromApi),
        courses,
        pending: pendingRes.map(pendingItemFromApi),
        selectedPlaceId: s.selectedPlaceId ?? (places[0] ? places[0].id : null),
        dashCourseId: s.dashCourseId ?? (courses[0] ? courses[0].id : null),
        bootLoading: false
      }));
    } catch (e) {
      setState((s) => ({ ...s, bootLoading: false, bootError: e.message || '데이터를 불러오지 못했습니다' }));
    }
  }, []);

  /** 마운트 시 1회: 401 응답 감지 시 세션을 정리하는 핸들러 등록 + 복원된 세션이 있으면 목록 로드 */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      clearPersistedSession();
      setState(createInitialState());
      toast('warn', '세션이 만료되었습니다', '다시 로그인해주세요.');
    });
    if (rawState.auth === 'app') loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 인증 상태 ↔ URL 경로 가드 — 미인증 접근/잘못된 경로/이미 로그인된 상태의 /login 접근을 정리 */
  useEffect(() => {
    if (rawState.auth === 'login') {
      if (location.pathname !== '/login') navigate('/login', { replace: true });
      return;
    }
    if (rawState.auth === 'register') {
      if (location.pathname !== '/register') navigate('/register', { replace: true });
      return;
    }
    if (!parseAppPath(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [rawState.auth, location.pathname, navigate]);

  const api = useMemo(() => {
    const region = (id) => state.regions.find((r) => r.id === id);
    const place = (id) => state.places.find((p) => p.id === id);
    const reward = (id) => state.rewards.find((r) => r.id === id);
    const placesOf = (regionId) => state.places.filter((p) => p.region_id === regionId);
    const coursesUsingReward = (rid) => state.courses.filter((c) => c.reward_id === rid);
    const coursesUsingPlace = (pid) => {
      const p = place(pid);
      return (p && p.referencing_courses) || [];
    };

    /** state.courses(목록) + courseDetails + courseStats 를 합친 화면용 코스 객체 */
    const getCourseFull = (id) => {
      const item = state.courses.find((c) => c.id === id);
      if (!item) return null;
      const detail = state.courseDetails[id];
      const stats = state.courseStats[id];
      return {
        ...item,
        completed: 0,
        abandoned: 0,
        reward_claimed: 0,
        ...(detail || {}),
        ...(stats || {}),
        _detailLoaded: !!detail,
        _statsLoaded: !!stats
      };
    };

    const ensureCourseFull = (id) => {
      if (id == null) return;
      if (state.courseDetails[id] === undefined) {
        patch((s) => ({ courseDetails: { ...s.courseDetails, [id]: null } }));
        coursesApi
          .detail(id)
          .then((res) =>
            patch((s) => ({ courseDetails: { ...s.courseDetails, [id]: courseDetailFromApi(res) } }))
          )
          .catch((e) => {
            patch((s) => {
              const cd = { ...s.courseDetails };
              delete cd[id];
              return { courseDetails: cd };
            });
            toast('warn', '코스 상세를 불러오지 못했습니다', e.message);
          });
      }
      if (state.courseStats[id] === undefined) {
        patch((s) => ({ courseStats: { ...s.courseStats, [id]: null } }));
        coursesApi
          .stats(id)
          .then((res) => patch((s) => ({ courseStats: { ...s.courseStats, [id]: courseStatsFromApi(res) } })))
          .catch(() => {
            patch((s) => {
              const cs = { ...s.courseStats };
              delete cs[id];
              return { courseStats: cs };
            });
          });
      }
    };

    const ensurePlaceUsage = (id) => {
      if (id == null) return;
      const p = place(id);
      if (!p || p.referencing_courses !== undefined) return;
      placesApi
        .detail(id)
        .then((res) => {
          const detail = placeFromApi(res);
          patch((s) => ({
            places: s.places.map((x) =>
              x.id === id ? { ...x, referencing_courses: detail.referencing_courses || [] } : x
            )
          }));
        })
        .catch(() => {});
    };

    const go = (screen) => {
      navigate(pathForScreen(screen, null));
      patch({ draftPlaces: null, dirty: false, modal: null });
    };
    const closeModal = () => patch({ modal: null, form: {} });
    const setField = (key, ev) => {
      const t = ev.target;
      const v = t.type === 'checkbox' ? t.checked : t.value;
      patch((s) => ({ form: { ...s.form, [key]: v, error: '' } }));
    };
    const failForm = (msg) => patch((s) => ({ form: { ...s.form, error: msg } }));

    /* ── 지역 ─────────────────────────────────── */
    const openRegionForm = (r) =>
      patch({
        modal: 'form',
        form: r
          ? { kind: 'region', id: r.id, name: r.name, type: r.type }
          : { kind: 'region', name: '', type: '도심' }
      });

    const deleteRegion = (r) => {
      const kids = placesOf(r.id);
      if (kids.length) {
        patch({
          modal: 'alert',
          alert: {
            severity: 'block',
            title: '등록된 장소가 있어 삭제할 수 없습니다',
            message: `「${r.name}」에 등록된 장소 ${kids.length}개가 이 지역에 속해 있습니다. 장소를 다른 지역으로 옮기거나 먼저 삭제한 뒤 다시 시도하세요.`,
            itemsLabel: '이 지역에 속한 장소',
            items: kids.map((p) => ({ name: p.name, note: p.category })),
            hint: '지역 삭제는 속한 장소가 모두 정리된 뒤에만 가능해요.',
            actionLabel: '장소 관리로 이동',
            action: { type: 'goPlaces', regionId: r.id }
          }
        });
        return;
      }
      patch({
        modal: 'alert',
        alert: {
          severity: 'confirm',
          title: '지역을 삭제할까요?',
          message: `「${r.name}」을 삭제합니다. 속한 장소가 없어 바로 삭제돼요.`,
          actionLabel: '삭제',
          action: { type: 'confirmRegion', id: r.id, name: r.name }
        }
      });
    };

    /* ── Place ────────────────────────────────── */
    const openPlaceForm = (p) => {
      const first = state.regions[0];
      patch({
        modal: 'form',
        form: p
          ? {
              kind: 'place',
              id: p.id,
              name: p.name,
              region_id: String(p.region_id),
              latitude: String(p.latitude),
              longitude: String(p.longitude),
              category: p.category,
              image_url: p.image_url || ''
            }
          : {
              kind: 'place',
              name: '',
              region_id: String(first ? first.id : ''),
              latitude: '',
              longitude: '',
              category: '',
              image_url: ''
            }
      });
    };

    const deletePlace = async (p) => {
      let used = [];
      try {
        const detail = placeFromApi(await placesApi.detail(p.id));
        used = detail.referencing_courses || [];
        patch((s) => ({
          places: s.places.map((x) => (x.id === p.id ? { ...x, referencing_courses: used } : x))
        }));
      } catch (e) {
        toast('warn', '장소 정보를 확인하지 못했습니다', e.message);
        return;
      }
      if (used.length) {
        patch({
          modal: 'alert',
          alert: {
            severity: 'block',
            title: '코스에 포함된 장소는 삭제할 수 없습니다',
            message: `「${p.name}」은 코스 ${used.length}개의 방문 장소로 포함되어 있습니다. 해당 코스의 구성에서 먼저 빼낸 뒤 삭제하세요.`,
            itemsLabel: '이 장소를 포함한 코스',
            items: used.map((c) => ({ name: c.name, note: statusLabel(c.status) })),
            hint: '코스 관리 → 구성 편집에서 장소를 빼고 「구성 전체 저장」을 누르면 연결이 풀려요.',
            actionLabel: '코스 관리로 이동',
            action: { type: 'goCourses' }
          }
        });
        return;
      }
      patch({
        modal: 'alert',
        alert: {
          severity: 'confirm',
          title: '장소를 삭제할까요?',
          message: `「${p.name}」을 삭제합니다. 발급된 QR 코드도 함께 폐기되어 현장 QR 은 더 이상 인식되지 않아요.`,
          actionLabel: '삭제',
          action: { type: 'confirmPlace', id: p.id, name: p.name }
        }
      });
    };

    /* ── 리워드 ───────────────────────────────── */
    const openRewardForm = (r, restock) =>
      patch({
        modal: 'form',
        form: r
          ? {
              kind: 'reward',
              id: r.id,
              name: r.name,
              kindOf: r.kind,
              description: r.description,
              stock: String(restock ? r.stock + 500 : r.stock),
              valid_until: r.valid_until,
              restock: !!restock
            }
          : { kind: 'reward', name: '', kindOf: '포인트', description: '', stock: '', valid_until: '' }
      });

    const deleteReward = (r) => {
      const used = coursesUsingReward(r.id);
      if (used.length) {
        patch({
          modal: 'alert',
          alert: {
            severity: 'block',
            title: '코스에 연결된 리워드는 삭제할 수 없습니다',
            message: `「${r.name}」은 코스 ${used.length}개에 완주 리워드로 연결되어 있습니다. 코스의 리워드 연결을 해제한 뒤 삭제하세요.`,
            itemsLabel: '이 리워드를 연결한 코스',
            items: used.map((c) => ({ name: c.name })),
            hint: '코스 상세의 「연결 리워드」를 연결 없음으로 바꾸면 풀려요.',
            actionLabel: '코스 관리로 이동',
            action: { type: 'goCourses' }
          }
        });
        return;
      }
      patch({
        modal: 'alert',
        alert: {
          severity: 'confirm',
          title: '리워드를 삭제할까요?',
          message: `「${r.name}」을 삭제합니다. 연결된 코스가 없어 바로 삭제돼요.`,
          actionLabel: '삭제',
          action: { type: 'confirmReward', id: r.id, name: r.name }
        }
      });
    };

    /* ── 코스 ─────────────────────────────────── */
    const openCourseForm = () =>
      patch({
        modal: 'form',
        form: { kind: 'course', name: '', description: '', reward_id: '', is_ordered: true }
      });

    const openCourse = (c) => {
      navigate(pathForScreen('courses', c.id));
      patch({ draftPlaces: null, dirty: false, poolSearch: '', modal: null });
      ensureCourseFull(c.id);
    };

    const closeCourseDetail = () => {
      navigate('/courses');
      patch({ draftPlaces: null, dirty: false });
    };

    const deleteCourse = async (c) => {
      if (c.participants > 0) {
        let stats = { completed: 0, abandoned: 0, reward_claimed: 0 };
        try {
          stats = courseStatsFromApi(await coursesApi.stats(c.id));
        } catch {
          /* 통계 조회 실패해도 보관 안내는 계속 진행 */
        }
        patch({
          modal: 'alert',
          alert: {
            severity: 'block',
            title: '참가자가 있는 코스는 삭제 대신 보관합니다',
            message: `「${c.name}」에는 참가 기록 ${num(c.participants)}건이 있습니다. 완전히 삭제하면 참가·완주 이력이 함께 사라지므로, 대신 코스를 보관 처리해 주세요.`,
            itemsLabel: '영향 범위',
            items: [
              { name: '참가 기록', note: `${num(c.participants)}건` },
              { name: '완주 기록', note: `${num(stats.completed)}건` },
              { name: '리워드 수령', note: `${num(stats.reward_claimed)}건` }
            ],
            hint: '보관 처리하면 사용자에게는 더 이상 보이지 않지만, 이력은 그대로 남아요.',
            actionLabel: '보관 처리',
            action: { type: 'archiveCourse', id: c.id, name: c.name }
          }
        });
        return;
      }
      patch({
        modal: 'alert',
        alert: {
          severity: 'confirm',
          title: '코스를 삭제할까요?',
          message: `「${c.name}」을 삭제합니다. 참가 기록이 없어 완전히 삭제할 수 있어요.`,
          actionLabel: '삭제',
          action: { type: 'confirmCourse', id: c.id, name: c.name }
        }
      });
    };

    const moveDraft = (from, to) =>
      patch((s) => {
        const arr = (s.draftPlaces || []).slice();
        if (to < 0 || to >= arr.length) return {};
        const [it] = arr.splice(from, 1);
        arr.splice(to, 0, it);
        return { draftPlaces: arr, dirty: true };
      });

    const addDraft = (pid) =>
      patch((s) => ({ draftPlaces: [...(s.draftPlaces || []), pid], dirty: true }));

    const removeDraft = (i) =>
      patch((s) => ({ draftPlaces: (s.draftPlaces || []).filter((_, j) => j !== i), dirty: true }));

    const updateCourse = async (id, next, toastTitle, toastDetail) => {
      try {
        await coursesApi.update(id, coursePatchToApi(next));
        patch((s) => ({
          courses: s.courses.map((c) => (c.id === id ? { ...c, ...next } : c)),
          courseDetails: s.courseDetails[id]
            ? { ...s.courseDetails, [id]: { ...s.courseDetails[id], ...next } }
            : s.courseDetails
        }));
        if (toastTitle) toast('ok', toastTitle, toastDetail);
      } catch (e) {
        toast('warn', '변경 사항을 저장하지 못했습니다', e.message);
      }
    };

    const saveCoursePlaces = async () => {
      if (!state.dirty) {
        toast('info', '변경 사항이 없습니다', '구성이 서버 상태와 동일합니다');
        return;
      }
      const id = state.openCourseId;
      const draft = state.draftPlaces || [];
      try {
        await coursesApi.replacePlaces(id, coursePlacesToApi(draft));
        patch((s) => ({
          courseDetails: s.courseDetails[id]
            ? { ...s.courseDetails, [id]: { ...s.courseDetails[id], places: draft.slice() } }
            : s.courseDetails,
          courses: s.courses.map((c) => (c.id === id ? { ...c, place_count: draft.length } : c)),
          dirty: false
        }));
        toast('ok', '코스 구성을 저장했습니다', `방문 장소 ${draft.length}곳으로 갈아치웠어요`);
      } catch (e) {
        toast('warn', '구성 저장에 실패했습니다', e.message);
      }
    };

    /* ── 알림 모달 액션 ───────────────────────── */
    const runAction = async (a) => {
      if (!a) return;
      if (a.type === 'goPlaces') {
        navigate('/places');
        patch({ regionFilter: String(a.regionId), modal: null });
        return;
      }
      if (a.type === 'goCourses') {
        navigate('/courses');
        patch({ modal: null });
        return;
      }
      if (a.type === 'confirmRegion') {
        try {
          await regionsApi.remove(a.id);
          patch((s) => ({ regions: s.regions.filter((r) => r.id !== a.id), modal: null }));
          toast('ok', '지역을 삭제했습니다', a.name);
        } catch (e) {
          toast('warn', '지역을 삭제하지 못했습니다', e.message);
        }
        return;
      }
      if (a.type === 'confirmPlace') {
        try {
          await placesApi.remove(a.id);
          patch((s) => {
            const rest = s.places.filter((p) => p.id !== a.id);
            return {
              places: rest,
              modal: null,
              selectedPlaceId: s.selectedPlaceId === a.id ? (rest[0] ? rest[0].id : null) : s.selectedPlaceId
            };
          });
          toast('ok', '장소를 삭제했습니다', a.name);
        } catch (e) {
          toast('warn', '장소를 삭제하지 못했습니다', e.message);
        }
        return;
      }
      if (a.type === 'confirmReward') {
        try {
          await rewardsApi.remove(a.id);
          patch((s) => ({ rewards: s.rewards.filter((r) => r.id !== a.id), modal: null }));
          toast('ok', '리워드를 삭제했습니다', a.name);
        } catch (e) {
          toast('warn', '리워드를 삭제하지 못했습니다', e.message);
        }
        return;
      }
      if (a.type === 'confirmCourse') {
        try {
          await coursesApi.remove(a.id);
          navigate('/courses');
          patch((s) => ({
            courses: s.courses.filter((c) => c.id !== a.id),
            modal: null
          }));
          toast('ok', '코스를 삭제했습니다', a.name);
        } catch (e) {
          toast('warn', '코스를 삭제하지 못했습니다', e.message);
        }
        return;
      }
      if (a.type === 'archiveCourse') {
        try {
          await coursesApi.update(a.id, coursePatchToApi({ status: 'archived' }));
          patch((s) => ({
            courses: s.courses.map((c) => (c.id === a.id ? { ...c, status: 'archived' } : c)),
            modal: null
          }));
          toast('ok', '코스를 보관 처리했습니다', a.name);
        } catch (e) {
          toast('warn', '보관 처리하지 못했습니다', e.message);
        }
      }
    };

    /* ── 폼 제출 ──────────────────────────────── */
    const submitForm = async () => {
      const f = state.form || {};

      if (f.kind === 'region') {
        if (!f.name || !f.name.trim()) return failForm('이름을 입력해 주세요.');
        try {
          if (f.id) {
            const res = regionFromApi(await regionsApi.update(f.id, regionToApi(f)));
            patch((s) => ({
              regions: s.regions.map((r) => (r.id === f.id ? { ...r, ...res } : r)),
              modal: null,
              form: {}
            }));
            toast('ok', '지역을 수정했습니다', f.name);
          } else {
            const res = regionFromApi(await regionsApi.create(regionToApi(f)));
            patch((s) => ({ regions: [...s.regions, res], modal: null, form: {} }));
            toast('ok', '지역을 생성했습니다', f.name);
          }
        } catch (e) {
          failForm(e.message);
        }
        return;
      }

      if (f.kind === 'place') {
        if (!f.name || !f.name.trim()) return failForm('이름을 입력해 주세요.');
        const lat = parseFloat(f.latitude);
        const lng = parseFloat(f.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng))
          return failForm('위도와 경도는 숫자로 입력해 주세요.');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
          return failForm('좌표 범위를 벗어났습니다. 위도는 -90~90, 경도는 -180~180 사이여야 해요.');
        try {
          if (f.id) {
            const res = placeFromApi(await placesApi.update(f.id, placeUpdateToApi(f)));
            patch((s) => ({
              places: s.places.map((p) => (p.id === f.id ? { ...p, ...res } : p)),
              modal: null,
              form: {}
            }));
            toast('ok', '장소를 수정했습니다', f.name);
          } else {
            const res = placeFromApi(await placesApi.create(placeCreateToApi(f)));
            patch((s) => ({
              places: [...s.places, res],
              selectedPlaceId: res.id,
              modal: null,
              form: {}
            }));
            toast('ok', '장소를 생성했습니다', 'QR 코드가 자동으로 발급됐어요.');
          }
        } catch (e) {
          failForm(e.message);
        }
        return;
      }

      if (f.kind === 'reward') {
        if (!f.name || !f.name.trim()) return failForm('이름을 입력해 주세요.');
        const stock = parseInt(f.stock, 10);
        if (Number.isNaN(stock) || stock < 0) return failForm('재고 수량은 0 이상의 정수로 입력해 주세요.');
        try {
          if (f.id) {
            const res = rewardFromApi(await rewardsApi.update(f.id, rewardUpdateToApi(f)));
            patch((s) => ({
              rewards: s.rewards.map((r) => (r.id === f.id ? { ...r, ...res } : r)),
              modal: null,
              form: {}
            }));
            toast(
              'ok',
              f.restock ? '재고를 보충했습니다' : '리워드를 수정했습니다',
              `현재 재고 ${stock}개`
            );
          } else {
            const res = rewardFromApi(await rewardsApi.create(rewardCreateToApi(f)));
            patch((s) => ({ rewards: [...s.rewards, res], modal: null, form: {} }));
            toast('ok', '리워드를 생성했습니다', f.name);
          }
        } catch (e) {
          failForm(e.message);
        }
        return;
      }

      if (f.kind === 'course') {
        if (!f.name || !f.name.trim()) return failForm('이름을 입력해 주세요.');
        try {
          const detail = courseDetailFromApi(await coursesApi.create(courseCreateToApi(f)));
          const listItem = {
            id: detail.id,
            name: detail.name,
            type: detail.type,
            status: detail.status,
            is_ordered: detail.is_ordered,
            view_count: detail.view_count,
            place_count: detail.places.length,
            reward_id: detail.reward_id,
            reward_name: detail.reward_name,
            participants: 0
          };
          navigate(pathForScreen('courses', detail.id));
          patch((s) => ({
            courses: [...s.courses, listItem],
            courseDetails: { ...s.courseDetails, [detail.id]: detail },
            modal: null,
            form: {},
            draftPlaces: detail.places.slice(),
            dirty: false
          }));
          toast('ok', '코스를 생성했습니다', '공식 코스로 등록됐고, 아직 준비중 상태예요.');
        } catch (e) {
          failForm(e.message);
        }
        return;
      }

      if (f.kind === 'approve') {
        const q = state.pending.find((p) => p.id === f.id);
        if (!q) return;
        const bonus = f.bonus_reward_id ? parseInt(f.bonus_reward_id, 10) : undefined;
        try {
          await coursesApi.approve(f.id, bonus !== undefined ? { bonus_reward_id: bonus } : {});
          const list = await coursesApi.list();
          patch((s) => ({
            pending: s.pending.filter((p) => p.id !== f.id),
            courses: list.map(courseListItemFromApi),
            modal: null,
            form: {}
          }));
          toast('ok', '코스를 승인했습니다', bonus ? `${q.name} · 보너스 리워드 연결됨` : q.name);
        } catch (e) {
          failForm(e.message);
        }
        return;
      }

      if (f.kind === 'reject') {
        if (!f.reason || !f.reason.trim())
          return failForm('반려 사유를 입력해야 만든 사람에게 전달돼요.');
        const q = state.pending.find((p) => p.id === f.id);
        try {
          await coursesApi.reject(f.id, { reason: f.reason.trim() });
          patch((s) => ({ pending: s.pending.filter((p) => p.id !== f.id), modal: null, form: {} }));
          toast('warn', '코스를 반려했습니다', q ? q.name : '');
        } catch (e) {
          failForm(e.message);
        }
      }
    };

    /* ── 인증 ─────────────────────────────────── */
    const submitLogin = async () => {
      const lf = state.loginForm;
      if (!lf.email || !lf.email.includes('@')) {
        patch((s) => ({ loginForm: { ...s.loginForm, error: '이메일 형식이 올바르지 않습니다.' } }));
        return;
      }
      if (!lf.password) {
        patch((s) => ({ loginForm: { ...s.loginForm, error: 'password 를 입력하세요.' } }));
        return;
      }
      patch((s) => ({ loginForm: { ...s.loginForm, loading: true, error: '' } }));
      try {
        const res = await authApi.login(loginToApi(lf));
        if (!res.user || res.user.role !== 'organization') {
          patch((s) => ({
            loginForm: { ...s.loginForm, loading: false, error: '조직 관리자 계정으로만 로그인할 수 있어요.' }
          }));
          return;
        }
        if (!res.access_token) {
          patch((s) => ({
            loginForm: { ...s.loginForm, loading: false, error: '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
          }));
          return;
        }
        const session = {
          org_name: lf.email.split('@')[1] || '조직',
          admin_name: res.user.name,
          admin_email: lf.email,
          role: res.user.role,
          initials: initialsOf(res.user.name)
        };
        setToken(res.access_token);
        savePersistedSession(res.access_token, session);
        navigate('/dashboard');
        patch({
          auth: 'app',
          session,
          loginForm: { email: '', password: '', error: '', loading: false }
        });
        toast('ok', '로그인했습니다', '대시보드로 이동합니다.');
        loadAll();
      } catch (e) {
        patch((s) => ({ loginForm: { ...s.loginForm, loading: false, error: e.message } }));
      }
    };

    const submitRegister = async () => {
      const g = state.regForm;
      if (!g.organization_name || !g.admin_name || !g.admin_email || !g.admin_password) {
        patch((s) => ({
          regForm: { ...s.regForm, error: '조직명, 담당자명, 이메일, 비밀번호는 필수입니다.' }
        }));
        return;
      }
      if (g.admin_password.length < 8) {
        patch((s) => ({
          regForm: { ...s.regForm, error: '비밀번호는 8자 이상으로 입력해 주세요.' }
        }));
        return;
      }
      patch((s) => ({ regForm: { ...s.regForm, loading: true, error: '' } }));
      try {
        const res = await authApi.register(registerToApi(g));
        if (!res.access_token) {
          patch((s) => ({ regForm: { ...s.regForm, loading: false, error: '가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' } }));
          return;
        }
        const session = {
          org_name: g.organization_name.trim(),
          admin_name: g.admin_name.trim(),
          admin_email: g.admin_email.trim(),
          role: 'organization',
          initials: initialsOf(g.admin_name)
        };
        setToken(res.access_token);
        savePersistedSession(res.access_token, session);
        navigate('/dashboard');
        patch({
          auth: 'app',
          session,
          regForm: {
            organization_name: '',
            organization_type: 'government',
            admin_name: '',
            admin_email: '',
            admin_password: '',
            error: '',
            loading: false
          }
        });
        toast(
          'ok',
          '조직을 생성하고 로그인했습니다',
          '조직과 관리자 계정이 만들어졌어요.'
        );
        loadAll();
      } catch (e) {
        patch((s) => ({ regForm: { ...s.regForm, loading: false, error: e.message } }));
      }
    };

    const logout = () => {
      setToken(null);
      clearPersistedSession();
      setState(createInitialState());
      navigate('/login');
    };

    return {
      region,
      place,
      reward,
      placesOf,
      coursesUsingReward,
      coursesUsingPlace,
      getCourseFull,
      ensureCourseFull,
      ensurePlaceUsage,
      go,
      closeModal,
      setField,
      openRegionForm,
      deleteRegion,
      openPlaceForm,
      deletePlace,
      openRewardForm,
      deleteReward,
      openCourseForm,
      openCourse,
      closeCourseDetail,
      deleteCourse,
      moveDraft,
      addDraft,
      removeDraft,
      updateCourse,
      saveCoursePlaces,
      runAction,
      submitForm,
      submitLogin,
      submitRegister,
      logout,
      reloadAll: loadAll
    };
  }, [state, patch, toast, loadAll, navigate]);

  const value = useMemo(
    () => ({ state, patch, toast, dragFrom, session: state.session, ...api }),
    [state, patch, toast, api]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
