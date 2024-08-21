import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {BulkOperationsComponent} from "../cards/bulk-operations/bulk-operations.component";
import {TagBadgeComponent} from "../shared/tag-badge/tag-badge.component";
import {AsyncPipe, DecimalPipe, DOCUMENT, NgStyle} from "@angular/common";
import {CardActionablesComponent} from "../_single-module/card-actionables/card-actionables.component";
import {CarouselReelComponent} from "../carousel/_components/carousel-reel/carousel-reel.component";
import {ExternalListItemComponent} from "../cards/external-list-item/external-list-item.component";
import {ExternalSeriesCardComponent} from "../cards/external-series-card/external-series-card.component";
import {ImageComponent} from "../shared/image/image.component";
import {LoadingComponent} from "../shared/loading/loading.component";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbModal,
  NgbNav, NgbNavChangeEvent,
  NgbNavContent, NgbNavItem,
  NgbNavLink, NgbNavOutlet,
  NgbProgressbar,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {PersonBadgeComponent} from "../shared/person-badge/person-badge.component";
import {ReviewCardComponent} from "../_single-module/review-card/review-card.component";
import {SeriesCardComponent} from "../cards/series-card/series-card.component";
import {VirtualScrollerModule} from "@iharbeck/ngx-virtual-scroller";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {ImageService} from "../_services/image.service";
import {ChapterService} from "../_services/chapter.service";
import {Chapter} from "../_models/chapter";
import {forkJoin, map, Observable, tap} from "rxjs";
import {SeriesService} from "../_services/series.service";
import {Series} from "../_models/series";
import {AgeRating} from "../_models/metadata/age-rating";
import {AgeRatingPipe} from "../_pipes/age-rating.pipe";
import {TimeDurationPipe} from "../_pipes/time-duration.pipe";
import {ExternalRatingComponent} from "../series-detail/_components/external-rating/external-rating.component";
import {LibraryType} from "../_models/library/library";
import {LibraryService} from "../_services/library.service";
import {ThemeService} from "../_services/theme.service";
import {DownloadEvent, DownloadService} from "../shared/_services/download.service";
import {translate, TranslocoDirective} from "@jsverse/transloco";
import {BulkSelectionService} from "../cards/bulk-selection.service";
import {ToastrService} from "ngx-toastr";
import {ReaderService} from "../_services/reader.service";
import {AccountService} from "../_services/account.service";
import {ReadMoreComponent} from "../shared/read-more/read-more.component";
import {DetailsTabComponent} from "../_single-module/details-tab/details-tab.component";
import {EntityTitleComponent} from "../cards/entity-title/entity-title.component";
import {EditChapterModalComponent} from "../_single-module/edit-chapter-modal/edit-chapter-modal.component";
import {ReadTimePipe} from "../_pipes/read-time.pipe";
import {FilterField} from "../_models/metadata/v2/filter-field";
import {FilterComparison} from "../_models/metadata/v2/filter-comparison";
import {FilterUtilitiesService} from "../shared/_services/filter-utilities.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DefaultValuePipe} from "../_pipes/default-value.pipe";
import {ReadingList} from "../_models/reading-list";
import {ReadingListService} from "../_services/reading-list.service";
import {CardItemComponent} from "../cards/card-item/card-item.component";
import {RelatedTabComponent} from "../_single-modules/related-tab/related-tab.component";
import {AgeRatingImageComponent} from "../_single-modules/age-rating-image/age-rating-image.component";
import {CompactNumberPipe} from "../_pipes/compact-number.pipe";
import {BadgeExpanderComponent} from "../shared/badge-expander/badge-expander.component";
import {
  MetadataDetailRowComponent
} from "../series-detail/_components/metadata-detail-row/metadata-detail-row.component";
import {DownloadButtonComponent} from "../series-detail/_components/download-button/download-button.component";
import {hasAnyCast} from "../_models/common/i-has-cast";
import {CarouselTabComponent} from "../carousel/_components/carousel-tab/carousel-tab.component";
import {CarouselTabsComponent, TabId} from "../carousel/_components/carousel-tabs/carousel-tabs.component";
import {Breakpoint, UtilityService} from "../shared/_services/utility.service";

enum TabID {
  Related = 'related-tab',
  Reviews = 'review-tab', // Only applicable for books
  Details = 'details-tab'
}

@Component({
  selector: 'app-chapter-detail',
  standalone: true,
  imports: [
    BulkOperationsComponent,
    AsyncPipe,
    CardActionablesComponent,
    CarouselReelComponent,
    DecimalPipe,
    ExternalListItemComponent,
    ExternalSeriesCardComponent,
    ImageComponent,
    LoadingComponent,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbNav,
    NgbNavContent,
    NgbNavLink,
    NgbProgressbar,
    NgbTooltip,
    PersonBadgeComponent,
    ReviewCardComponent,
    SeriesCardComponent,
    TagBadgeComponent,
    VirtualScrollerModule,
    NgStyle,
    AgeRatingPipe,
    TimeDurationPipe,
    ExternalRatingComponent,
    TranslocoDirective,
    ReadMoreComponent,
    NgbNavItem,
    NgbNavOutlet,
    DetailsTabComponent,
    RouterLink,
    EntityTitleComponent,
    ReadTimePipe,
    DefaultValuePipe,
    CardItemComponent,
    RelatedTabComponent,
    AgeRatingImageComponent,
    CompactNumberPipe,
    BadgeExpanderComponent,
    MetadataDetailRowComponent,
    DownloadButtonComponent,
    CarouselTabComponent,
    CarouselTabsComponent
  ],
  templateUrl: './chapter-detail.component.html',
  styleUrl: './chapter-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChapterDetailComponent implements OnInit {

  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdRef = inject(ChangeDetectorRef);
  protected readonly imageService = inject(ImageService);
  private readonly chapterService = inject(ChapterService);
  private readonly seriesService = inject(SeriesService);
  private readonly libraryService = inject(LibraryService);
  private readonly themeService = inject(ThemeService);
  private readonly downloadService = inject(DownloadService);
  private readonly bulkSelectionService = inject(BulkSelectionService);
  private readonly toastr = inject(ToastrService);
  private readonly readerService = inject(ReaderService);
  protected readonly accountService = inject(AccountService);
  private readonly modalService = inject(NgbModal);
  private readonly filterUtilityService = inject(FilterUtilitiesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly readingListService = inject(ReadingListService);
  protected readonly utilityService = inject(UtilityService);


  protected readonly AgeRating = AgeRating;
  protected readonly TabID = TabID;
  protected readonly FilterField = FilterField;

  @ViewChild('scrollingBlock') scrollingBlock: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('companionBar') companionBar: ElementRef<HTMLDivElement> | undefined;

  isLoading: boolean = true;
  coverImage: string = '';
  chapterId: number = 0;
  seriesId: number = 0;
  libraryId: number = 0;
  chapter: Chapter | null = null;
  series: Series | null = null;
  libraryType: LibraryType | null = null;
  hasReadingProgress = false;
  activeTabId = TabID.Details;
  /**
   * This is the download we get from download service.
   */
  download$: Observable<DownloadEvent | null> | null = null;
  downloadInProgress: boolean = false;
  readingLists: ReadingList[] = [];
  showDetailsTab: boolean = true;



  get ScrollingBlockHeight() {
    if (this.scrollingBlock === undefined) return 'calc(var(--vh)*100)';
    const navbar = this.document.querySelector('.navbar') as HTMLElement;
    if (navbar === null) return 'calc(var(--vh)*100)';

    const companionHeight = this.companionBar?.nativeElement.offsetHeight || 0;
    const navbarHeight = navbar.offsetHeight;
    const totalHeight = companionHeight + navbarHeight + 21; //21px to account for padding
    return 'calc(var(--vh)*100 - ' + totalHeight + 'px)';
  }


  ngOnInit() {
    const seriesId = this.route.snapshot.paramMap.get('seriesId');
    const libraryId = this.route.snapshot.paramMap.get('libraryId');
    const chapterId = this.route.snapshot.paramMap.get('chapterId');
    if (seriesId === null || libraryId === null || chapterId === null) {
      this.router.navigateByUrl('/home');
      return;
    }


    this.seriesId = parseInt(seriesId, 10);
    this.chapterId = parseInt(chapterId, 10);
    this.libraryId = parseInt(libraryId, 10);

    this.coverImage = this.imageService.getChapterCoverImage(this.chapterId);


    forkJoin({
      series: this.seriesService.getSeries(this.seriesId),
      chapter: this.chapterService.getChapterMetadata(this.chapterId),
      libraryType: this.libraryService.getLibraryType(this.libraryId)
    }).subscribe(results => {

      if (results.chapter === null) {
        this.router.navigateByUrl('/home');
        return;
      }

      this.series = results.series;
      this.chapter = results.chapter;
      this.libraryType = results.libraryType;

      this.themeService.setColorScape(this.chapter.primaryColor, this.chapter.secondaryColor);

      // Set up the download in progress
      this.download$ = this.downloadService.activeDownloads$.pipe(takeUntilDestroyed(this.destroyRef), map((events) => {
        return this.downloadService.mapToEntityType(events, this.chapter!);
      }));

      this.readingListService.getReadingListsForChapter(this.chapterId).subscribe(lists => {
        this.readingLists = lists;
        this.cdRef.markForCheck();
      });

      this.route.fragment.pipe(tap(frag => {
        if (frag !== null && this.activeTabId !== (frag as TabID)) {
          this.activeTabId = frag as TabID;
          this.updateUrl(this.activeTabId);
          this.cdRef.markForCheck();
        }
      }), takeUntilDestroyed(this.destroyRef)).subscribe();

      this.showDetailsTab = hasAnyCast(this.chapter) || (this.chapter.genres || []).length > 0 || (this.chapter.tags || []).length > 0;
      this.isLoading = false;
      this.cdRef.markForCheck();
    });

    this.cdRef.markForCheck();
  }

  loadData() {
    this.chapterService.getChapterMetadata(this.chapterId).subscribe(d => {
      if (d === null) {
        this.router.navigateByUrl('/home');
        return;
      }

      this.chapter = d;
      this.cdRef.markForCheck();
    })
  }

  read(incognitoMode: boolean = false) {
    if (this.bulkSelectionService.hasSelections()) return;
    if (this.chapter === null) return;

    if (this.chapter.pages === 0) {
      this.toastr.error(translate('series-detail.no-pages'));
      return;
    }
    this.router.navigate(this.readerService.getNavigationArray(this.series?.libraryId!, this.seriesId, this.chapter.id, this.chapter.files[0].format),
      {queryParams: {incognitoMode}});
  }

  openEditModal() {
    const ref = this.modalService.open(EditChapterModalComponent, { size: 'xl' });
    ref.componentInstance.chapter = this.chapter;
    ref.componentInstance.libraryType = this.libraryType;
    ref.componentInstance.libraryId = this.libraryId;
    ref.componentInstance.seriesId = this.series!.id;

    ref.closed.subscribe(res => {
      this.loadData();
    });
  }

  onNavChange(event: NgbNavChangeEvent) {
    this.bulkSelectionService.deselectAll();
    this.updateUrl(event.nextId);
    this.cdRef.markForCheck();
  }

  updateUrl(activeTab: TabID) {
    const newUrl = `${this.router.url.split('#')[0]}#${activeTab}`;
    //this.router.navigateByUrl(newUrl, { onSameUrlNavigation: 'ignore' });
  }

  openPerson(field: FilterField, value: number) {
    this.filterUtilityService.applyFilter(['all-series'], field, FilterComparison.Equal, `${value}`).subscribe();
  }

  downloadChapter() {
    this.downloadService.download('chapter', this.chapter!, (d) => {
      this.downloadInProgress = !!d;
      this.cdRef.markForCheck();
    });
  }

  protected readonly TabId = TabId;
  protected readonly Breakpoint = Breakpoint;
}
