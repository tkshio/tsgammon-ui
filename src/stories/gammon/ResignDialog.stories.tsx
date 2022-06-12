import { Meta, Story } from '@storybook/react'
import React from 'react'
import { ResignOffer } from 'tsgammon-core/dispatchers/ResignState'
import {
    ResignDialog,
    ResignDialogProps
} from '../../gammon/components/uiparts/ResignDialog'


export default {
    title: 'ResignDialog',
    component: ResignDialog,
    parameters: {},
} as Meta

const Template: Story<ResignDialogProps> = (args:ResignDialogProps) => {
    return <ResignDialog {...args} />
}

export const resign = Template.bind({})
resign.args = {
    resignState: { tag: 'RSInChoose', isRed: false },
}

export const offered = Template.bind({})
offered.args = {
    resignState: { tag: 'RSOffered', offer:ResignOffer.Gammon, isRed:true },
}

export const rejected = Template.bind({})
rejected.args = {
    resignState:  { tag: 'RSInChoose', isRed: false, lastOffer: ResignOffer.Backgammon }
}
