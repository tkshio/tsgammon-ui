import {Meta, Story} from "@storybook/react";
import React, {ComponentProps} from "react";
import {UnlimitedMatch} from "../../gammon/components/UnlimitedMatch";
import {
    whiteSideAutoOperator,
    whiteSideBoardOperator
} from "../../gammon/models/GameOperators";
import {dnEngine} from "../../gammon/engines/SimpleNNGammon";

export default {
    title: 'Engines',
    component: UnlimitedMatch,
    parameters: {}
} as Meta;

const Template: Story<ComponentProps<typeof UnlimitedMatch>> = (args) => <UnlimitedMatch {...args}/>

export const random = Template.bind({})
random.args = {}

export const jGammon = Template.bind({})
jGammon.args = {
    boardOperator: whiteSideBoardOperator(),
    autoOperator: whiteSideAutoOperator(dnEngine())
}
