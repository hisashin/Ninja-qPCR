<template>
  <div class="panel">
    <section class="section">
      <header class="section__header">
        <h2 class="section__header__title" >Section Title</h2>
        <div class="section__header__menu">Header Menu</div>
      </header>
      <nav class="section__nav section__nav--top">
        Top Navigation
      </nav>
      <div class="section__body">
        <!-- Variant: List card -->
        <ul class="item item--list-card">
          <li class="item--list-card__cell item--list-card__cell--header">
            List Header
          </li>
          <li class="item--list-card__cell item--list-card__cell--item">
            List Item
          </li>
          <li class="item--list-card__cell item--list-card__cell--item">
            List Item
          </li>
          <li class="item--list-card__cell item--list-card__cell--footer">
            List Footer
          </li>
          <li class="item--list-card__cell item--list-card__cell--error"></li>
        </ul>
        <!-- Variant: Detail card -->
        <div class="item item--detail-card">
          <header class="item--detail-card__header">
            Detail Card Header
          </header>
          <div class="item--detail-card__body">
            <div class="item--detail-card__body__content">
              Detail Card Body Content
            </div>
          </div>
          <footer class="item--detail-card__footer">
            Detail Card Footer
          </footer>
        </div>
        <!-- Variant: Paragraph -->
        <p class="item item--paragraph">
          Paragraph
        </p>
        <p class="item item--paragraph">
          Paragraph
        </p>
        <!-- Variant: Tabbed -->
        <div class="item item--tabbed">
          <b-tabs pills content-class="item--tabbed__content" nav-wrapper-class="item--tabbed__tabs">
            <b-tab
              title="Tab 0"
              active>
              <div>
                Tab 0 content
              </div>
            </b-tab>
            <b-tab title="Tab 1">
              <div>
                Tab 1 content
              </div>
            </b-tab>
            <b-tab title="Tab 2">
              <div>
                Tab 2 content
              </div>
            </b-tab>
          </b-tabs>
        </div>
      </div>
      <nav class="section__nav section__nav--bottom">
        Bottom Navigation
      </nav>
    </section>
  </div>
</template>