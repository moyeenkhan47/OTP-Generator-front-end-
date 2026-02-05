import { Component, OnDestroy, NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  // Task 1: OTP properties (3 or 6 digits) 
  otp: string = '----';
  selectedLength: number = 6;
  timeLeft: number = 0;

  // Task 4: State management properties 
  loading = false;
  otpGenerated = false;
  error: string | null = null;
  successMessage: string | null = null;

  private eventSource?: EventSource;
  private countdownTimer?: any;

  // Task 2: Backend API URL 
  private readonly API_URL = 'https://otp-generator-bkbr.onrender.com/api/otp/generate';

  constructor(private zone: NgZone) {}

  generateOtp(): void {
    this.resetState();
    this.loading = true;

    

    if (this.eventSource) {
      this.eventSource.close();
    }

    // Task 4: Integration with Spring Boot SSE stream 
this.eventSource = new EventSource(`${this.API_URL}?digits=${this.selectedLength}`, {
   withCredentials: false 
});
    // Listening for the 'otp' named event from your Spring Boot Flux
this.eventSource.addEventListener('otp', (event: any) => {   
      this.zone.run(() => {
        try {
          const data = JSON.parse(event.data);

          this.otp = data.otp; // Task 1 
          this.loading = false;
          this.error = null;
          
          if (!this.otpGenerated) {
            this.successMessage = 'OTP Generate Successfully!';
          }
          
          this.otpGenerated = true;
          // Task 3: Handle 30-second auto-refresh countdown 
          this.startCountdown(data.validForSeconds || 30); 
        } catch (err) {
          this.handleFailure('Data format error from backend.');
        }
      });
    });

    this.eventSource.onerror = (err) => {
      this.zone.run(() => {
        this.handleFailure('Backend disconnected. Please check Spring Boot server.');
      });
    };
  }

  // Task 3: 30-second countdown logic 
  private startCountdown(seconds: number): void {
    this.clearCountdown();
    this.timeLeft = seconds;
    this.countdownTimer = window.setInterval(() => {
      this.zone.run(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        }
      });
    }, 1000);
  }

  private handleFailure(message: string): void {
    this.error = message;
    this.successMessage = null;
    this.loading = false;
    this.otp = '----';
    this.cleanup();
  }
getCountdownColor(timeLeft: number): string {
  const total = 30;
  const ratio = timeLeft / total;

  if (ratio > 0.6) {
    return '#22c55e'; // green
  } else if (ratio > 0.3) {
    return '#eab308'; // yellow
  } else {
    return '#ef4444'; // red
  }
}

  private resetState(): void {
    this.cleanup();
    this.otp = '----';
    this.error = null;
    this.successMessage = null;
    this.otpGenerated = false;
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private cleanup(): void {
    this.eventSource?.close();
    this.eventSource = undefined;
    this.clearCountdown();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
  
}