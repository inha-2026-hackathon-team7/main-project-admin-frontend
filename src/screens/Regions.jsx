import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead, Hint } from '../components/Notice.jsx';
import { PlusIcon } from '../components/Icon.jsx';
import { blockedBtn } from '../lib/format.js';

export default function Regions() {
  const { state, placesOf, openRegionForm, deleteRegion } = useAdmin();

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P0 · REGIONS"
        title="지역 관리"
        desc="단일 레벨 · 조직 소유 지역만 조회됩니다 (GET /admin/regions)"
      >
        <button className="btn btn-primary" onClick={() => openRegionForm(null)} style={{ flex: 'none' }}>
          <PlusIcon />
          지역 생성
        </button>
      </PageHead>

      <div className="card blueprint" style={{ padding: 0 }}>
        <Corners />
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 600, whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>ID</th>
                <th>지역명</th>
                <th>type</th>
                <th style={{ textAlign: 'right' }}>Place</th>
                <th style={{ textAlign: 'right' }}>연결 코스</th>
                <th style={{ textAlign: 'right', paddingRight: 16 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {state.regions.map((r) => {
                const pc = placesOf(r.id).length;
                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        paddingLeft: 16,
                        fontFamily: 'ui-monospace,Menlo,monospace',
                        fontSize: 12,
                        color: 'var(--color-neutral-600)'
                      }}
                    >
                      RG-{String(r.id).padStart(3, '0')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>
                      <span className="tag tag-neutral">{r.type}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pc}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {r.course_count}
                    </td>
                    <td style={{ paddingRight: 16 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => openRegionForm(r)}>
                          수정
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => deleteRegion(r)}
                          title={pc ? `하위 Place ${pc}개가 있어 삭제할 수 없습니다` : '삭제 가능'}
                          style={blockedBtn(pc > 0)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Hint>
        DELETE /admin/regions/&#123;id&#125; 은 하위 place 가 남아 있으면 FK 제약으로 실패합니다. 목록의 Place 수가 0 이
        아닌 행은 삭제를 시도하면 차단 안내가 표시됩니다.
      </Hint>
    </div>
  );
}
