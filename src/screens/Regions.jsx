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
        desc="우리 조직이 관리하는 지역 목록이에요."
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
                <th>유형</th>
                <th style={{ textAlign: 'right' }}>장소</th>
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
                          title={pc ? `이 지역에 속한 장소 ${pc}개가 있어 삭제할 수 없습니다` : '삭제 가능'}
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
        속한 장소가 남아 있는 지역은 삭제할 수 없어요. 장소 수가 0이 아닌 행에서 삭제를 시도하면 안내
        메시지가 표시돼요.
      </Hint>
    </div>
  );
}
