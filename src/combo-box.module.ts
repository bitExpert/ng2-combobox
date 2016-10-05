import {NgModule} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

import {ComboBoxComponent} from './combo-box.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    declarations: [
        ComboBoxComponent
    ],
    exports: [
        ComboBoxComponent
    ],
    providers: [
    ]
})
export class ComboBoxModule {}
