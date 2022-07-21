import { Meta, Story } from '@storybook/react'
import React from 'react'
import { cube } from 'tsgammon-core/CubeState'
import { Cube, CubeProps } from '../../gammon/components/boards/Cube'

const decolator =
    (bgColor = 'white', fgColor?: string) =>
    (Story: Story) => {
        const style = {
            border: '0 solid black',
            '--psize': '48px',
            '--fgColor': fgColor,
            '--bgColor': bgColor,
        }

        return (
            <div style={style}>
                <Story />
            </div>
        )
    }

export default {
    title: 'Cube',
    component: Cube,
    parameters: {},
    decorators: [decolator()],
} as Meta

const Template: Story<CubeProps> = (args: CubeProps) => {
    return <Cube cube={args.cube} />
}

export const cubes = Template.bind({})
cubes.args = { cube: cube(1) }

export const noCube = Template.bind({})
noCube.args = {}

const ListTemplate: Story<{ items: CubeProps[] }> = ({ items }) => (
    <div>
        {items.map((item, index) => (
            <Cube key={index} {...item} />
        ))}
    </div>
)

export const cubeSet = ListTemplate.bind({})
cubeSet.args = {
    items: [
        { cube: cube(1) },
        { cube: cube(2) },
        { cube: cube(4) },
        { cube: cube(8) },
        { cube: cube(16) },
        { cube: cube(32) },
        { cube: cube(64) },
        { cube: cube(128) },
        { cube: cube(256) },
        { cube: cube(512) },
        { cube: cube(1), isCrawford: true },
        { cube: cube(1), isCubeMaxForMatch: true },
        { cube: cube(1, undefined, 1) },
    ],
}
