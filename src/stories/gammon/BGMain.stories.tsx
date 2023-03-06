import { Meta, Story } from '@storybook/react'
import React from 'react'
import { BGMain, BGMainProps } from '../../gammon/apps/BGMain'

export default {
    title: 'BGMain',
    component: BGMain,
    parameters: {},
} as Meta

const Template: Story<BGMainProps> = (args) => {
    return <BGMain {...args} />
}

export const main = Template.bind({})
main.args = {}
