import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { connect, Room, createLocalVideoTrack } from "twilio-video";
import { HttpClient } from "@angular/common/http";
@Component({
  selector: "app-video-component",
  templateUrl: "./video-component.component.html",
  styleUrls: ["./video-component.component.css"]
})
export class VideoComponentComponent implements OnInit {
  constructor(private route: ActivatedRoute, private http: HttpClient) {}
  ngVersion: string;
  streaming = false;
  error: any;
  private stream: MediaStream = null;
  room: Room;
  @ViewChild("video") video: ElementRef;

  @ViewChild("twilio") twilio: ElementRef;

  ngOnInit() {
    console.log(this.twilio);
    console.log(this.route.snapshot.paramMap.get("id"));
    this.http.get("http://172.16.1.15:4000/token").subscribe(
      res => {
        connect(
          res["token"],
          { name: "testroom", audio: true, video: true }
        ).then(room => {
          this.room = room;
          const localParticipant = room.localParticipant;
          console.log(
            `Connected to the Room as LocalParticipant "${
              localParticipant.identity
            }"`
          );

          // Log any Participants already connected to the Room
          room.participants.forEach(participant => {
            console.log(
              `Already Participant "${
                participant.identity
              }" is connected to the Room`
            );
          });

          // Log new Participants as they connect to the Room
          room.on("participantConnected", participant => {
            console.log(`New Participant connected : ${participant.identity}`);
            console.log(participant.tracks);
            participant.tracks.forEach(publication => {
              console.log(`Publication`);
              console.log(publication);
            });

            participant.on("trackSubscribed", track => {
              console.log(track);
            });
          });

          // Log Participants as they disconnect from the Room
          room.once("participantDisconnected", participant => {
            console.log(
              `Participant "${
                participant.identity
              }" has disconnected from the Room`
            );
          });

          // When a Participant adds a Track, attach it to the DOM.
          room.on("trackAdded", (track, participant) => {
            console.log("Track Add");
            console.log(track.kind === "video");
            this.attachTracks([track]);
            // const _video = this.video.nativeElement;
            // _video.srcObject = track;
          });

          console.log(room);
        });
      },
      error => {
        console.log(error);
      }
    );
  }

  ngAfterViewInit() {}

  attachTracks(tracks) {
    tracks.forEach(track => {
      this.twilio.nativeElement.appendChild(track.attach());
    });
  }

  initVideo(e) {
    this.getMediaStream()
      .then(stream => {
        this.stream = stream;
        this.streaming = true;
      })
      .catch(err => {
        this.streaming = false;
        this.error =
          err.message + " (" + err.name + ":" + err.constraintName + ")";
      });
  }

  private getMediaStream(): Promise<MediaStream> {
    const video_constraints = { video: true };
    const _video = this.video.nativeElement;
    return new Promise<MediaStream>((resolve, reject) => {
      // (get the stream)
      return navigator.mediaDevices
        .getUserMedia(video_constraints)
        .then(stream => {
          (<any>window).stream = stream; // make variable available to browser console
          _video.srcObject = stream;
          // _video.src = window.URL.createObjectURL(stream);
          _video.onloadedmetadata = function(e: any) {};
          _video.play();
          return resolve(stream);
        })
        .catch(err => reject(err));
    });
  }
}
