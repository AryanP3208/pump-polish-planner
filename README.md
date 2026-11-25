# Pump Polish Planner

Design an interactive 3D gas station cleaning booking experience featuring a realistic model of the entire station.

Use real-world fuel pump designs as references, with accurate proportions and recognizable details such as displays, payment terminals, nozzles, hoses, and pump bases. Model the full station environment, including the canopy, pump islands, columns, pavement, and convenience-store exterior.

Customers should be able to:

Configure their station by entering the total number of pumps, whether they have 2, 10, or more. Display clearly numbered pumps in the 3D layout.

Select individual pumps by clicking them, select several pumps, or choose “Select all.” Clearly highlight each selection.

Choose cleaning areas by zooming into a selected pump and clicking its exterior, display, buttons, payment terminal, nozzle, hose, or base. Include a “Clean entire pump” option.

Select surrounding areas such as the pump island and nearby pavement, with a visible boundary showing how much area will be cleaned.

Apply the same cleaning choices to multiple pumps or customize each pump separately.

Review a live summary of selected pumps and cleaning areas before continuing.

Make the entire station a detailed, navigable 3D scene. Start with an overview, then smoothly move closer when a customer selects a pump. Support rotation, zoom, and mobile touch controls. Keep pump numbers and selection highlights readable from every useful viewing angle.

Use realistic materials, natural lighting, smooth motion, and a clean, professional interface. Provide a matching list view for easy selection and review.

Focus first on the complete 3D station and the interactive pump-and-area selection section.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab78b323-c6a0-4cec-8110-633045758a29).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
