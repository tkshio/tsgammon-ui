import { Meta, Story } from '@storybook/react'
import React from 'react'
import { eog, score, scoreAsRed } from 'tsgammon-core'

import {
    EOGDialog,
    EOGDialogProps,
} from '../../gammon/components/uiparts/EOGDialog'

export default {
    title: 'EOGDialog',
    component: EOGDialog,
    parameters: {},
} as Meta

const Template: Story<EOGDialogProps> = (args) => {
    return <EOGDialog {...args} />
}

export const unlimited = Template.bind({})
unlimited.args = {
    stake:scoreAsRed(1),
    eogStatus:eog(),
    score:score(),
    isCrawfordNext:true // should be ignored
}
export const pointMatch = Template.bind({})
pointMatch.args = {
    stake:scoreAsRed(1),
    eogStatus:eog(),
    score:score(),
    matchLength:7,
    isCrawfordNext:false
}
export const crawford = Template.bind({})
crawford.args = {
    stake:scoreAsRed(1),
    eogStatus:eog(),
    score:score(),
    matchLength:7,
    isCrawfordNext:true
}

export const endOfMatch = Template.bind({})
endOfMatch.args = {
    stake:scoreAsRed(1),
    eogStatus:eog(),
    score:score(),
    matchLength:7,
    isCrawfordNext:true, // should be ignored
    isEoM:true
}

