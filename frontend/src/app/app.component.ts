import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div>
      <h1 style="text-align: center; color: #333;">Customer Lead Management</h1>

      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  title = 'Customer Lead Management';
}