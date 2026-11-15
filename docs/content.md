# Content

Everything the site says is in two places, always in both languages, saying the same thing. Turkish addresses the
visitor as "siz".

## `src/data.ts`

- `ui`: the interface text (menu, buttons, headings, the 404 page).
- `featured`: the four projects on the home page's deck, with a short label, the stack shown on the card and one line
  about what stands out. `also` lists the smaller cards under them.
- `caseOrder`: every project with a page, in order. The sitemap, the terminal's `ls`, the 404 page's list and the
  "next project" links follow it.
- `cv`: experience, education and skills, as in the CV PDFs; keep them in step.
- `about`, `fetch`, `term`: the About section, the skills panel and what the terminal prints.

## Projects

`src/content/projects/<id>/en.md` holds a project in English as YAML front matter: name, repository, language, date,
links, images and the case study. `tr.md` holds only what is translated (`since`, `desc` and `case`) and is laid over
the English file, so its `case` must be complete, images included.

A card says what the project is in one or two sentences (`desc`). The case study answers, in this order:

| Section | Question |
| --- | --- |
| Overview | What is it? |
| Why I built it | What problem does it solve, what was the goal? |
| What I built | What I did, and why each choice was made, not only what it was |
| The hard part | A real difficulty and how it was solved |
| Result | What it achieved, its limits, what was learned |
| Screens | Optional screenshots |

Take the difficulties from the project's own repository and documents; don't repeat the README.

After adding a project or changing a name, lede or image, run `pnpm og` for its share images. A new project also needs
its id in `caseOrder`.

## Images

Screenshots and covers are WebP files in `public/assets/`, referenced with their width and height. An image wider than
640px also gets a 640px copy next to it, and a cover wider than 960px a 960px one; phones load those instead
(`magick name.webp -resize 640x -quality 82 name-640.webp`). Never use a screenshot that shows third-party artwork
(for example film posters).

## The CV

Replace `public/cv/en.pdf` and `public/cv/tr.pdf` with the public versions of the CV, then run `pnpm cv`: it writes the
page images to `public/cv/` and the text and link layer to `src/cv/`.
