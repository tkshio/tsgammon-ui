import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { formatMatchRecord } from 'tsgammon-core/records/utils/formatMatchRecord'
import { CopyTextButton } from '../uiparts/CopyTextButton'
import { PlyRecords, PlyRecordsProps } from './PlyRecords'
import { SelectableStateListeners } from './useSelectableState'

import './recordedGame.css'
import { PlayersConf } from '../uiparts/PlayersConf'

export function RecordedGame<T>(
    props: {
        children: JSX.Element
        matchRecord: MatchRecord<T>
        playersConf:PlayersConf
        index: number | undefined
    } & SelectableStateListeners<T>
) {
    const {
        children,
        index,
        onSelect,
        onSelectLatest,
        onResumeState,
        matchRecord,
        playersConf,
    } = props
    const eogRecord = matchRecord.curGameRecord.isEoG
        ? matchRecord.curGameRecord.eogRecord
        : undefined
    const plyRecords = matchRecord.curGameRecord.plyRecords
    const isLatest =
        index === undefined || index < 0 || plyRecords.length <= index

    // 最新状態の場合、どこも選択されていないので何もしない（onClickも設定しない）
    // そうでなければ、履歴遷移時には選択を解除して最新状態にする
    const doResumeState = isLatest
        ? undefined
        : () => {
              // 以下の条件は (!isLatest)と同値なので常にtrueだが、コンパイラの警告を回避するために指定している
              if (
                  index !== undefined &&
                  0 <= index &&
                  index < plyRecords.length
              ) {
                  onResumeState(index, plyRecords[index].state)
              }
          }

    const plyRecordsProps: PlyRecordsProps<T> = {
        plyRecords,
        eogRecord,
        matchScore: matchRecord.matchState.scoreBefore,
        playersConf,
        selected: index,
        dispatcher: (index: number, state?: T) => {
            if (state) {
                onSelect({ index, state })
            } else {
                onSelectLatest()
            }
        },
    }

    const matchRecordText = formatMatchRecord(matchRecord,playersConf.red.name, playersConf.white.name)
    return (
        <div id={'main'}>
            <div id={'boardPane'}>
                {children}
                <CopyTextButton
                    getText={() => matchRecordText}
                />
                <div id={'matchRecord'}>
                    <pre>{matchRecordText}</pre>
                </div>
            </div>
            <div id={'recordsPane'}>
                <div>
                    <div
                        id={'resume'}
                        className={'button' + (isLatest ? ' disabled' : '')}
                        onClick={doResumeState}
                    >
                        Go back
                    </div>
                </div>
                <PlyRecords {...plyRecordsProps} />
            </div>
        </div>
    )
}
