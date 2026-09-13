import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead, Hint } from '../components/Notice.jsx';
import { PlusIcon } from '../components/Icon.jsx';
import { num, typeTag, typeLabel, statusTag, statusLabel, blockedBtn } from '../lib/format.js';

export default function CourseList() {
  const { state, patch, openCourseForm, openCourse, deleteCourse } = useAdmin();

  const filtered = state.courses.filter(
    (c) =>
      (state.courseType === 'all' || c.type === state.courseType) &&
      (state.courseStatus === 'all' || c.status === state.courseStatus)
  );

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P0 · COURSES"
        title="코스 관리"
        desc="관리자가 직접 만든 코스는 공식 코스로 등록됩니다. 코스에 포함할 장소는 아래에서 언제든 바꿀 수 있어요."
        marginBottom={18}
      >
        <button className="btn btn-primary" onClick={openCourseForm} style={{ flex: 'none' }}>
          <PlusIcon />
          코스 생성
        </button>
      </PageHead>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select
          className="input"
          value={state.courseType}
          onChange={(e) => patch({ courseType: e.target.value })}
          style={{ width: 'auto', minWidth: 150 }}
        >
          <option value="all">전체 유형</option>
          <option value="official">공식</option>
          <option value="user">사용자 제작</option>
          <option value="ai">AI 추천</option>
        </select>
        <select
          className="input"
          value={state.courseStatus}
          onChange={(e) => patch({ courseStatus: e.target.value })}
          style={{ width: 'auto', minWidth: 150 }}
        >
          <option value="all">전체 상태</option>
          <option value="draft">준비중</option>
          <option value="published">게시됨</option>
          <option value="archived">보관됨</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
          {filtered.length} / {state.courses.length}개
        </span>
      </div>

      <div className="card blueprint" style={{ padding: 0 }}>
        <Corners />
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 840, whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>코스</th>
                <th>유형</th>
                <th>상태</th>
                <th>구성</th>
                <th>리워드</th>
                <th style={{ textAlign: 'right' }}>조회</th>
                <th style={{ textAlign: 'right' }}>참가자</th>
                <th style={{ textAlign: 'right', paddingRight: 16 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                      {c.is_ordered ? '순서대로 방문' : '자유롭게 방문'}
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${typeTag(c.type)}`}>{typeLabel(c.type)}</span>
                  </td>
                  <td>
                    <span className={`tag ${statusTag(c.status)}`}>{statusLabel(c.status)}</span>
                  </td>
                  <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{c.place_count}개 장소</td>
                  <td style={{ fontSize: 13 }}>{c.reward_id ? c.reward_name || '삭제된 리워드' : '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(c.view_count)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(c.participants)}</td>
                  <td style={{ paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => openCourse(c)}>
                        구성 편집
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => deleteCourse(c)}
                        title={
                          c.participants > 0
                            ? `참가자 ${num(c.participants)}명 — 삭제 대신 보관 처리해 주세요`
                            : '삭제 가능'
                        }
                        style={blockedBtn(c.participants > 0)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Hint maxWidth={680}>
        참가 기록이 있는 코스는 완전히 삭제하는 대신 보관 처리됩니다. 참가자가 있는 행의 삭제 버튼은
        비활성이며, 상세 화면의 상태 드롭다운에서 보관 처리할 수 있어요.
      </Hint>
    </div>
  );
}
