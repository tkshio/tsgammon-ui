import { Meta, Story } from '@storybook/react'
import React from 'react'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { Board } from '../../gammon/components/boards/Board'
import {
    ResignDialog,
    ResignDialogProps,
} from '../../gammon/components/uiparts/ResignDialog'

export default {
    title: 'ResignDialog',
    component: ResignDialog,
    parameters: {},
} as Meta

const Template: Story<ResignDialogProps> = (args: ResignDialogProps) => {
    const dialog = <ResignDialog {...args} />
    return <Board dialog={dialog}/>
}

export const resign = Template.bind({})
resign.args = {
    resignState: { tag: 'RSToOffer', isRed: false },
}

export const offered = Template.bind({})
offered.args = {
    resignState: { tag: 'RSOffered', offer: ResignOffer.Gammon, isRed: true },
}

export const rejected = Template.bind({})
rejected.args = {
    resignState: {
        tag: 'RSToOffer',
        isRed: false,
        lastOffer: ResignOffer.Single,
    },
}
export const rejected_gammon = Template.bind({})
rejected_gammon.args = {
    resignState: {
        tag: 'RSToOffer',
        isRed: false,
        lastOffer: ResignOffer.Gammon,
    },
}
export const rejected_backgammon = Template.bind({})
rejected_backgammon.args = {
    resignState: {
        tag: 'RSToOffer',
        isRed: false,
        lastOffer: ResignOffer.Backgammon
    },
}
export const saved = Template.bind({})
saved.args = {
    isGammonSaved: true,
    resignState: {
        tag: 'RSToOffer',
        isRed: false,
    },
}
