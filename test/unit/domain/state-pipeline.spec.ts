import { expect } from 'chai'
import sinon from 'sinon'
import { GameState } from '../../../src/game-state'
import { Arena } from '../../../src/components/arena'
import { process } from '../../../src/domain/state-update-pipeline'

describe('Domain - State pipeline', () => {
  it('executes each of the pipeline steps', async () => {
    const pipelineItem1 = sinon.stub().resolves({ newState: 'state-1', updates: ['update-1'] })
    const pipelineItem2 = sinon.stub().resolves({ newState: 'state-2', updates: ['update-2'] })
    const initialState = new GameState({ arena: new Arena({ width: 100, height: 100 }) })

    const { state, updates } = await process([pipelineItem1, pipelineItem2], initialState)

    expect(state).to.eql('state-2')
    expect(updates).to.eql(['update-1', 'update-2'])
  })
})
